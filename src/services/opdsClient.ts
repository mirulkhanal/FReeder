import { buildOpdsAuthHeaders, normalizeCatalogEndpoint } from './opdsAuth';
import { loadCatalogPassword } from './opdsCredentials';
import { fetchHttpText } from './opdsHttp';
import { parseOpdsFeed, parseOpenSearchDescription } from './opdsParser';
import {
  isOpds2Json,
  parseOpds2Feed,
  parseOpds2SearchTemplate,
} from './opdsParser2';

import type { OpdsCatalog, OpdsFeed } from '../types/opds';
import type { OpdsSearchTemplate } from '../types/opds';

/**
 * Resolve OPDS link hrefs the way feed readers do.
 * Never turns /opds + opds/osd into /opds/opds/osd.
 */
export function resolveOpdsUrl(baseUrl: string, href: string): string {
  const trimmedHref = href.trim();
  if (!trimmedHref) {
    return normalizeCatalogEndpoint(baseUrl).url;
  }
  if (/^https?:\/\//i.test(trimmedHref)) {
    return collapseDuplicatePathSegments(trimmedHref);
  }

  const cleanedBase = normalizeCatalogEndpoint(baseUrl).url.replace(/\/+$/, '');
  const origin = new URL(cleanedBase);

  // Root-absolute path: always take from host root.
  if (trimmedHref.startsWith('/')) {
    return collapseDuplicatePathSegments(
      `${origin.protocol}//${origin.host}${trimmedHref}`,
    );
  }

  // Path-relative: resolve from the feed as a directory (…/opds/books),
  // then collapse accidental /opds/opds duplicates from bad servers/joins.
  const directoryBase = `${cleanedBase}/`;
  return collapseDuplicatePathSegments(
    new URL(trimmedHref, directoryBase).href,
  );
}

/** Fix /opds/opds/... from trailing-slash joins or PathBase + "/opds/...". */
function collapseDuplicatePathSegments(url: string): string {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(/\/{2,}/g, '/');
    path = path.replace(/\/([^/]+)\/\1(?=\/|$)/g, '/$1');
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

async function catalogWithPassword(catalog: OpdsCatalog): Promise<OpdsCatalog> {
  const endpoint = normalizeCatalogEndpoint(catalog.url);
  const storedPassword = await loadCatalogPassword(catalog.id);
  return {
    ...catalog,
    url: endpoint.url,
    username: catalog.username || endpoint.username,
    password: storedPassword ?? catalog.password ?? endpoint.password,
  };
}

/**
 * Moon+/KOReader-style request:
 * - clean catalog URL (no user:pass@)
 * - Authorization: Basic when username is set
 * - Accept-Encoding: identity (KOReader) so servers don't send broken gzip
 */
function buildRequestHeaders(catalog: OpdsCatalog): Record<string, string> {
  return {
    Accept:
      'application/atom+xml, application/xml, text/xml, application/opds+json, application/json, */*',
    'Accept-Encoding': 'identity',
    'User-Agent': 'FReeder/0.0.1 (OPDS; like KOReader)',
    ...buildOpdsAuthHeaders(catalog.username, catalog.password),
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
        `Could not reach ${formatSafeUrl(
          url,
        )}. Check Wi‑Fi/VPN reachability from this device (hostname vs IP).`,
      );
    }
  }
  return error instanceof Error ? error : new Error('Catalog request failed.');
}

function looksLikeHtmlDenial(body?: string): boolean {
  if (!body) {
    return false;
  }
  const head = body.trim().slice(0, 240).toLowerCase();
  return (
    head.startsWith('<!doctype') ||
    head.startsWith('<html') ||
    head.includes('<title>403')
  );
}

/** Real Basic/Digest challenges — not every 403 (CDNs/WAF often 403 with no auth). */
function isAuthHttpFailure(
  status: number,
  wwwAuthenticate?: string,
  bodySnippet?: string,
): boolean {
  // Gutenberg (and similar) return HTML 403 pages with no login challenge.
  if (looksLikeHtmlDenial(bodySnippet)) {
    return false;
  }
  if (status === 401) {
    return true;
  }
  if (status !== 403 || !wwwAuthenticate) {
    return false;
  }
  return /basic|digest|bearer/i.test(wwwAuthenticate);
}

function describeHttpFailure(
  status: number,
  url: string,
  options: {
    hadAuth: boolean;
    wwwAuthenticate?: string;
    bodySnippet?: string;
  },
): Error {
  const safeUrl = formatSafeUrl(url);
  if (isAuthHttpFailure(status, options.wwwAuthenticate, options.bodySnippet)) {
    if (!options.hadAuth) {
      return new Error(
        `Authentication required (${status}) for ${safeUrl}. This catalog expects a username and password — enter the same credentials the browser login prompt uses.`,
      );
    }
    return new Error(
      `Authentication failed (${status}) for ${safeUrl}. Check the username and password for this catalog.`,
    );
  }
  if (status === 403) {
    return new Error(
      `Access denied (403) for ${safeUrl}. The server refused the request (not a login prompt).`,
    );
  }
  if (status === 404) {
    return new Error(
      `Catalog not found (404) at ${safeUrl}. Confirm the OPDS root path (e.g. /opds, /opds/v1.2/catalog, …/search.opds/). Auth sent: ${
        options.hadAuth ? 'yes' : 'no'
      }.`,
    );
  }
  const detail = options.bodySnippet?.trim()
    ? ` Response: ${options.bodySnippet.trim().slice(0, 120)}`
    : '';
  return new Error(
    `Catalog request failed (${status}) at ${safeUrl}.${detail}`,
  );
}

function formatSafeUrl(url: string): string {
  try {
    return normalizeCatalogEndpoint(url).url;
  } catch {
    return url;
  }
}

function formatHost(url: string): string {
  try {
    return new URL(normalizeCatalogEndpoint(url).url).host;
  } catch {
    return url;
  }
}

/** Insert trailing slash before query/hash without relying on URL.pathname setters. */
function withTrailingSlashPath(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.length > 1 && !parsed.pathname.endsWith('/')) {
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}/${parsed.search}${parsed.hash}`;
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function withoutTrailingSlashPath(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      const path = parsed.pathname.replace(/\/+$/, '');
      return `${parsed.protocol}//${parsed.host}${path}${parsed.search}${parsed.hash}`;
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/**
 * Try both trailing-slash variants. For *.opds leaves, prefer the slashed form
 * first (Gutenberg). For directory roots like /opds, prefer unsashed first
 * (Jellyfin / Moon+ style).
 */
function candidateUrls(url: string): string[] {
  const normalized = normalizeCatalogEndpoint(url).url;
  const withSlash = withTrailingSlashPath(normalized);
  const withoutSlash = withoutTrailingSlashPath(normalized);
  const isOpdsLeaf = /\.opds\/?$/i.test(
    (() => {
      try {
        return new URL(normalized).pathname;
      } catch {
        return normalized;
      }
    })(),
  );

  const ordered = isOpdsLeaf
    ? [withSlash, withoutSlash]
    : [withoutSlash, withSlash];

  return ordered.filter((item, index) => ordered.indexOf(item) === index);
}

/** Detect OPDS 1 (Atom/XML) vs OPDS 2 (JSON) from Content-Type and/or body. */
export function detectOpdsKind(body: string, contentType?: string): '1' | '2' {
  const ct = (contentType ?? '').toLowerCase();
  if (
    ct.includes('opds+json') ||
    (ct.includes('json') && !ct.includes('xml'))
  ) {
    return '2';
  }
  if (ct.includes('atom') || ct.includes('xml')) {
    return '1';
  }

  const trimmed = body.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<?xml')) {
    return '1';
  }
  if (
    isOpds2Json(trimmed) ||
    (trimmed.startsWith('{') &&
      (trimmed.includes('"publications"') ||
        trimmed.includes('"navigation"') ||
        trimmed.includes('"metadata"')))
  ) {
    return '2';
  }

  return '1';
}

function parseFeedBody(
  body: string,
  contentType?: string,
  preferred?: '1' | '2',
): OpdsFeed {
  const kind = preferred ?? detectOpdsKind(body, contentType);
  try {
    return kind === '2' ? parseOpds2Feed(body) : parseOpdsFeed(body);
  } catch (firstError) {
    try {
      return kind === '2' ? parseOpdsFeed(body) : parseOpds2Feed(body);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error('Failed to parse OPDS feed.');
    }
  }
}

function parseSearchTemplateBody(
  body: string,
  contentType: string | undefined,
  descriptionUrl: string,
  preferred?: '1' | '2',
): OpdsSearchTemplate | null {
  const kind = preferred ?? detectOpdsKind(body, contentType);
  try {
    if (kind === '2') {
      const feed = parseOpds2Feed(body);
      return parseOpds2SearchTemplate(feed, descriptionUrl);
    }
    return parseOpenSearchDescription(body);
  } catch {
    try {
      if (kind === '2') {
        return parseOpenSearchDescription(body);
      }
      const feed = parseOpds2Feed(body);
      return parseOpds2SearchTemplate(feed, descriptionUrl);
    } catch {
      return null;
    }
  }
}

async function fetchOpdsResponse(
  catalog: OpdsCatalog,
  url: string,
): Promise<{ body: string; contentType?: string }> {
  const resolvedCatalog = await catalogWithPassword(catalog);
  const headers = buildRequestHeaders(resolvedCatalog);
  const hadAuth = Boolean(resolvedCatalog.username);
  const urls = candidateUrls(url);

  let lastHttpError: Error | null = null;

  for (const requestUrl of urls) {
    let response;
    try {
      response = await fetchHttpText(requestUrl, headers);
    } catch (error) {
      lastHttpError = describeFetchFailure(error, requestUrl);
      continue;
    }

    if (response.status >= 200 && response.status < 300) {
      return { body: response.body, contentType: response.contentType };
    }

    lastHttpError = describeHttpFailure(response.status, requestUrl, {
      hadAuth,
      wwwAuthenticate: response.wwwAuthenticate,
      bodySnippet: response.body,
    });

    // Auth challenges: stop. Plain 403/404: try the next candidate (trailing slash).
    if (
      isAuthHttpFailure(
        response.status,
        response.wwwAuthenticate,
        response.body,
      )
    ) {
      throw lastHttpError;
    }

    if (__DEV__) {
      console.warn(
        `[OPDS] ${response.status} ${requestUrl} — trying next candidate if any`,
      );
    }
  }

  throw lastHttpError ?? new Error('Catalog request failed.');
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
  const { body, contentType } = await fetchOpdsResponse(catalog, url);
  const version = catalog.opdsVersion ?? 'auto';
  const preferred = version === '1' || version === '2' ? version : undefined;
  return parseFeedBody(body, contentType, preferred);
}

export async function fetchOpenSearchTemplate(
  catalog: OpdsCatalog,
  descriptionUrl: string,
): Promise<OpdsSearchTemplate | null> {
  const { body, contentType } = await fetchOpdsResponse(
    catalog,
    descriptionUrl,
  );
  const version = catalog.opdsVersion ?? 'auto';
  const preferred = version === '1' || version === '2' ? version : undefined;
  return parseSearchTemplateBody(body, contentType, descriptionUrl, preferred);
}

export { formatHost };
export { normalizeCatalogEndpoint } from './opdsAuth';
