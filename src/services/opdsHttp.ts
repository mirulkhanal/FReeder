import ReactNativeBlobUtil from 'react-native-blob-util';

export type HttpTextResponse = {
  status: number;
  body: string;
  contentType?: string;
  wwwAuthenticate?: string;
};

function readHeader(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (!headers) {
    return undefined;
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower && typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

function looksLikeOpdsPayload(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('<?xml') || /^<feed[\s>]/i.test(trimmed)) {
    return true;
  }
  if (
    trimmed.startsWith('{') &&
    (trimmed.includes('"metadata"') ||
      trimmed.includes('"publications"') ||
      trimmed.includes('"navigation"'))
  ) {
    return true;
  }
  if (/<OpenSearchDescription[\s>]/i.test(trimmed)) {
    return true;
  }
  return false;
}

function normalizeStatus(status: number, body: string): number {
  if (status >= 200 && status < 300) {
    return status;
  }
  // blob-util sometimes drops status while still returning a usable body.
  if ((status === 0 || Number.isNaN(status)) && looksLikeOpdsPayload(body)) {
    return 200;
  }
  return status;
}

function toResponse(
  status: number,
  body: string,
  headers?: Record<string, string>,
): HttpTextResponse {
  return {
    status: normalizeStatus(status, body),
    body,
    contentType: readHeader(headers, 'content-type'),
    wwwAuthenticate: readHeader(headers, 'www-authenticate'),
  };
}

async function fetchWithBlobUtil(
  url: string,
  headers: Record<string, string>,
): Promise<HttpTextResponse> {
  // Preserve header name casing. Lowercasing "Authorization" has caused
  // intermittent auth failures with some Android stacks.
  const response = await ReactNativeBlobUtil.config({
    followRedirect: true,
    timeout: 30000,
  }).fetch('GET', url, headers);
  const info = response.info();
  const rawStatus = typeof info?.status === 'number' ? info.status : 0;
  const body = await response.text();
  const responseHeaders =
    info && typeof info === 'object' && 'headers' in info
      ? (info.headers as Record<string, string> | undefined)
      : undefined;
  return toResponse(rawStatus, body, responseHeaders);
}

async function fetchWithXhr(
  url: string,
  headers: Record<string, string>,
): Promise<HttpTextResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const body = xhr.responseText ?? '';
      const headerMap: Record<string, string> = {};
      const contentType = xhr.getResponseHeader('content-type');
      const www = xhr.getResponseHeader('www-authenticate');
      if (contentType) {
        headerMap['content-type'] = contentType;
      }
      if (www) {
        headerMap['www-authenticate'] = www;
      }
      resolve(toResponse(xhr.status, body, headerMap));
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Network request timed out'));
    xhr.open('GET', url);
    xhr.timeout = 30000;
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send();
  });
}

/**
 * Prefer XHR (predictable Authorization + status), fall back to blob-util for
 * Tailscale/LAN cases where RN networking fails.
 */
export async function fetchHttpText(
  url: string,
  headers: Record<string, string>,
): Promise<HttpTextResponse> {
  try {
    const xhrResponse = await fetchWithXhr(url, headers);
    if (
      xhrResponse.status > 0 ||
      looksLikeOpdsPayload(xhrResponse.body) ||
      xhrResponse.body.length > 0
    ) {
      return xhrResponse;
    }
  } catch {
    // Fall through to native blob stack.
  }

  return fetchWithBlobUtil(url, headers);
}
