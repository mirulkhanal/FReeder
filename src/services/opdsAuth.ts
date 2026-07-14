import { encodeBase64 } from '../utils/base64';

/**
 * Shared Basic-auth helpers for OPDS clients (Moon+/KOReader style).
 * Credentials go in the Authorization header only — never in the URL.
 * Moon+ ignores userinfo in the URL; KOReader uses user/password → Basic.
 */

export function encodeBasicAuthToken(
  username: string,
  password: string,
): string {
  const raw = `${username}:${password}`;
  // Jellyfin OPDS decodes the Basic payload as UTF-8.
  const bytes = Array.from(new TextEncoder().encode(raw), byte =>
    String.fromCharCode(byte),
  ).join('');
  return encodeBase64(bytes);
}

/** Strip http://user:pass@host/... into a clean URL + credentials. */
export function normalizeCatalogEndpoint(url: string): {
  url: string;
  username?: string;
  password?: string;
} {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const username = parsed.username
      ? decodeURIComponent(parsed.username)
      : undefined;
    const password =
      parsed.password !== '' && parsed.username
        ? decodeURIComponent(parsed.password)
        : parsed.username
        ? ''
        : undefined;

    // Collapse extra trailing slashes. Keep a single trailing slash for leaf
    // *.opds paths — Project Gutenberg 403s the same path without it.
    let pathname = parsed.pathname || '/';
    if (pathname.length > 1) {
      pathname = pathname.replace(/\/+$/, '');
      if (/\.opds$/i.test(pathname)) {
        pathname = `${pathname}/`;
      }
    }

    const clean = `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}${parsed.hash}`;

    return {
      url: clean,
      username: username || undefined,
      password: password !== undefined ? password : undefined,
    };
  } catch {
    return { url: trimmed };
  }
}

export function buildOpdsAuthHeaders(
  username?: string,
  password?: string,
): Record<string, string> {
  if (!username) {
    return {};
  }
  return {
    Authorization: `Basic ${encodeBasicAuthToken(username, password ?? '')}`,
  };
}
