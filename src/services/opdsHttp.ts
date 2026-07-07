import ReactNativeBlobUtil from 'react-native-blob-util';

export type HttpTextResponse = {
  status: number;
  body: string;
};

/**
 * OPDS catalogs are fetched with the native HTTP stack (not React Native fetch).
 * That matches apps like Moon+ Reader and routes correctly over Tailscale / LAN VPNs.
 */
export async function fetchHttpText(
  url: string,
  headers: Record<string, string>,
): Promise<HttpTextResponse> {
  const response = await ReactNativeBlobUtil.fetch('GET', url, headers);
  const info = response.info();
  const status = typeof info.status === 'number' ? info.status : 0;
  const body = await response.text();
  return { status, body };
}
