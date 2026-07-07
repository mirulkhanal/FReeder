import type { OpdsCatalog, OpdsFeed } from '../types/opds';
import { parseOpdsFeed, parseOpenSearchDescription } from './opdsParser';
import { isOpds2Json, parseOpds2Feed, parseOpds2SearchTemplate } from './opdsParser2';
import type { OpdsSearchTemplate } from '../types/opds';
import { encodeBase64 } from '../utils/base64';
import { fetchHttpText } from './opdsHttp';
import { loadCatalogPassword } from './opdsCredentials';

export function resolveOpdsUrl(baseUrl: string, href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return new URL(href, baseUrl).toString();
}

function authHeader(catalog: OpdsCatalog, password?: string): Record<string, string> {
  if (!catalog.username) {
    return {};
  }
  const token = encodeBase64(`${catalog.username}:${password ?? ''}`);
  return { Authorization: `Basic ${token}` };
}

async function catalogWithPassword(catalog: OpdsCatalog): Promise<OpdsCatalog> {
  const password = await loadCatalogPassword(catalog.id);
  return { ...catalog, password: password ?? catalog.password };
}

function requestHeaders(catalog: OpdsCatalog): Record<string, string> {
  return {
    Accept:
      'application/opds+json, application/atom+xml, application/xml, text/xml, application/json, */*',
    'User-Agent': 'FReeder/0.0.1 (OPDS)',
    ...authHeader(catalog, catalog.password),
  };
}

function isConnectionError(message: string): boolean {
  return (
    message.includes('network request failed') ||
    message.includes('failed to connect') ||
    message.includes('unable to resolve host') ||
    message.includes('unknownhost') ||
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    message.includes('cleartext') ||
    message.includes('timeout')
  );
}

function describeFetchFailure(error: unknown, url: string): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (isConnectionError(message)) {
      return new Error(
        `Could not reach ${formatHost(url)}. On Tailscale, try the server's 100.x.x.x IP or full MagicDNS name (e.g. meebian.your-tailnet.ts.net:25600) instead of a short hostname. For Komga, add your username and password. Rebuild the app after installing updates — a Metro reload is not enough for network changes.`,
      );
    }
  }
  return error instanceof Error ? error : new Error('Catalog request failed.');
}

function describeHttpFailure(status: number, url: string): Error {
  if (status === 401 || status === 403) {
    return new Error(
      `Authentication failed (${status}) for ${formatHost(url)}. Edit the catalog and add your Komga username and password.`,
    );
  }
  return new Error(`Catalog request failed (${status}) for ${formatHost(url)}.`);
}

function formatHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function fetchOpdsXml(
  catalog: OpdsCatalog,
  url: string,
): Promise<string> {
  const resolvedCatalog = await catalogWithPassword(catalog);
  let response: { status: number; body: string };
  try {
    response = await fetchHttpText(url, requestHeaders(resolvedCatalog));
  } catch (error) {
    throw describeFetchFailure(error, url);
  }

  if (response.status < 200 || response.status >= 300) {
    throw describeHttpFailure(response.status, url);
  }

  return response.body;
}

export async function probeOpdsCatalog(
  catalog: OpdsCatalog,
): Promise<{ ok: boolean; title?: string; error?: string }> {
  try {
    const feed = await fetchOpdsFeed(catalog, catalog.url);
    return { ok: true, title: feed.title };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Catalog is unreachable.',
    };
  }
}

export async function fetchOpdsFeed(
  catalog: OpdsCatalog,
  url: string,
): Promise<OpdsFeed> {
  const body = await fetchOpdsXml(catalog, url);
  if (isOpds2Json(body)) {
    return parseOpds2Feed(body, url);
  }
  return parseOpdsFeed(body);
}

export async function fetchOpenSearchTemplate(
  catalog: OpdsCatalog,
  descriptionUrl: string,
): Promise<OpdsSearchTemplate | null> {
  const body = await fetchOpdsXml(catalog, descriptionUrl);
  if (isOpds2Json(body)) {
    const feed = parseOpds2Feed(body, descriptionUrl);
    return parseOpds2SearchTemplate(feed, descriptionUrl);
  }
  return parseOpenSearchDescription(body);
}
