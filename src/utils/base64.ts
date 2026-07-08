function btoaPolyfill(value: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < value.length) {
    const a = value.charCodeAt(i++);
    const b = value.charCodeAt(i++);
    const c = value.charCodeAt(i++);
    const bitmap = a * 65536 + (b || 0) * 256 + (c || 0);
    output += chars.charAt(Math.floor(bitmap / 262144) % 64);
    output += chars.charAt(Math.floor(bitmap / 4096) % 64);
    output += b ? chars.charAt(Math.floor(bitmap / 64) % 64) : '=';
    output += c ? chars.charAt(bitmap % 64) : '=';
  }
  return output;
}

export function encodeBase64(value: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value);
  }
  return btoaPolyfill(value);
}
