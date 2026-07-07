function btoaPolyfill(value: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < value.length) {
    const a = value.charCodeAt(i++);
    const b = value.charCodeAt(i++);
    const c = value.charCodeAt(i++);
    const bitmap = (a << 16) | ((b || 0) << 8) | (c || 0);
    output += chars.charAt((bitmap >> 18) & 63);
    output += chars.charAt((bitmap >> 12) & 63);
    output += b ? chars.charAt((bitmap >> 6) & 63) : '=';
    output += c ? chars.charAt(bitmap & 63) : '=';
  }
  return output;
}

export function encodeBase64(value: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value);
  }
  return btoaPolyfill(value);
}
