import { Dirs, FileSystem } from 'react-native-file-access';

const BOOK_CACHE_DIR = `${Dirs.CacheDir}/books`;

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').trim() || 'book.epub';
}

function cacheKeyForUri(sourceUri: string): string {
  let hash = 0;
  for (let i = 0; i < sourceUri.length; i += 1) {
    hash = (hash << 5) - hash + sourceUri.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

async function ensureCacheDir(): Promise<void> {
  try {
    await FileSystem.mkdir(BOOK_CACHE_DIR);
  } catch {
    // Directory already exists.
  }
}

export async function resolveReadableBookUri(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  if (sourceUri.startsWith('file://')) {
    return sourceUri;
  }

  const safeName = sanitizeFileName(fileName);
  const cachePath = `${BOOK_CACHE_DIR}/${cacheKeyForUri(sourceUri)}_${safeName}`;

  if (await FileSystem.exists(cachePath)) {
    return `file://${cachePath}`;
  }

  await ensureCacheDir();
  await FileSystem.cp(sourceUri, cachePath);

  return `file://${cachePath}`;
}

export async function clearCachedBookCopy(
  sourceUri: string,
  fileName: string,
): Promise<void> {
  const safeName = sanitizeFileName(fileName);
  const cachePath = `${BOOK_CACHE_DIR}/${cacheKeyForUri(sourceUri)}_${safeName}`;

  if (!(await FileSystem.exists(cachePath))) {
    return;
  }

  try {
    await FileSystem.unlink(cachePath);
  } catch {
    // Best-effort cache cleanup.
  }
}
