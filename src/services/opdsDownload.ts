import { Platform } from 'react-native';
import {
  AndroidScoped,
  Dirs,
  FileSystem,
  Util,
} from 'react-native-file-access';

import { encodeBase64 } from '../utils/base64';

import { resolveOpdsUrl } from './opdsClient';
import { loadCatalogPassword } from './opdsCredentials';
import { getAcquisitionLinks } from './opdsParser';

import type { OpdsCatalog, OpdsEntry } from '../types/opds';

const LOCAL_LIBRARY_DIR = `${Dirs.DocumentDir}/freeder/library`;

function sanitizeFileName(name: string): string {
  const base = name
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) {
    return 'book.epub';
  }
  return base.toLowerCase().endsWith('.epub') ? base : `${base}.epub`;
}

function joinLibraryPath(folderUri: string, fileName: string): string {
  if (Platform.OS === 'android') {
    return AndroidScoped.appendPath(folderUri, fileName);
  }
  const separator = folderUri.endsWith('/') ? '' : '/';
  return `${folderUri}${separator}${fileName}`;
}

function requestHeaders(
  catalog: OpdsCatalog,
  password?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/epub+zip, application/epub, */*',
    'User-Agent': 'FReeder/0.0.1 (OPDS)',
  };
  if (catalog.username) {
    const token = encodeBase64(`${catalog.username}:${password ?? ''}`);
    headers.Authorization = `Basic ${token}`;
  }
  return headers;
}

async function ensureDir(path: string): Promise<void> {
  try {
    await FileSystem.mkdir(path);
  } catch {
    // Directory already exists.
  }
}

async function uniqueLibraryPath(
  folderUri: string,
  fileName: string,
): Promise<string> {
  let candidate = joinLibraryPath(folderUri, fileName);
  if (!(await FileSystem.exists(candidate))) {
    return candidate;
  }

  const extension = Util.extname(fileName) || '.epub';
  const baseName = Util.basename(fileName, extension);

  for (let index = 2; index < 100; index += 1) {
    candidate = joinLibraryPath(
      folderUri,
      `${baseName} (${index})${extension}`,
    );
    if (!(await FileSystem.exists(candidate))) {
      return candidate;
    }
  }

  return joinLibraryPath(folderUri, `${Date.now()}_${fileName}`);
}

async function uniqueLocalPath(fileName: string): Promise<string> {
  let candidate = `${LOCAL_LIBRARY_DIR}/${fileName}`;
  if (!(await FileSystem.exists(candidate))) {
    return candidate;
  }

  const extension = Util.extname(fileName) || '.epub';
  const baseName = Util.basename(fileName, extension);

  for (let index = 2; index < 100; index += 1) {
    candidate = `${LOCAL_LIBRARY_DIR}/${baseName} (${index})${extension}`;
    if (!(await FileSystem.exists(candidate))) {
      return candidate;
    }
  }

  return `${LOCAL_LIBRARY_DIR}/${Date.now()}_${fileName}`;
}

async function downloadToFile(
  url: string,
  headers: Record<string, string>,
  destPath: string,
): Promise<void> {
  const response = await FileSystem.fetch(url, {
    method: 'GET',
    headers,
    path: destPath,
  });

  if (!response.ok) {
    try {
      await FileSystem.unlink(destPath);
    } catch {
      // Ignore cleanup errors.
    }
    throw new Error(`Download failed (${response.status})`);
  }

  if (!(await FileSystem.exists(destPath))) {
    throw new Error('Download did not save to disk.');
  }

  const stat = await FileSystem.stat(destPath);
  if (stat.size <= 0) {
    try {
      await FileSystem.unlink(destPath);
    } catch {
      // Ignore cleanup errors.
    }
    throw new Error('Downloaded file was empty.');
  }
}

async function mirrorToUserFolder(
  localPath: string,
  libraryFolderUri: string,
  fileName: string,
): Promise<void> {
  const destPath = await uniqueLibraryPath(libraryFolderUri, fileName);
  await FileSystem.cp(localPath, destPath);
}

export type OpdsDownloadResult = {
  fileUrl: string;
  fileName: string;
  title: string;
  author?: string;
};

export async function downloadOpdsEntry(
  catalog: OpdsCatalog,
  entry: OpdsEntry,
  acquisitionUrl: string,
  baseUrl: string,
  libraryFolderUri?: string | null,
): Promise<OpdsDownloadResult> {
  const acquisitions = getAcquisitionLinks(entry);
  if (acquisitions.length === 0) {
    throw new Error('No DRM-free EPUB download is available for this book.');
  }

  const resolvedUrl = resolveOpdsUrl(baseUrl, acquisitionUrl);
  const fileName = sanitizeFileName(entry.title);
  const password = await loadCatalogPassword(catalog.id);
  const headers = requestHeaders(catalog, password ?? catalog.password);

  await ensureDir(LOCAL_LIBRARY_DIR);
  const localPath = await uniqueLocalPath(fileName);
  await downloadToFile(resolvedUrl, headers, localPath);

  if (libraryFolderUri) {
    try {
      await mirrorToUserFolder(localPath, libraryFolderUri, fileName);
    } catch (error) {
      if (__DEV__) {
        console.warn('OPDS mirror to library folder failed:', error);
      }
    }
  }

  return {
    fileUrl: `file://${localPath}`,
    fileName,
    title: entry.title,
    author: entry.author,
  };
}

export function pickAcquisitionUrl(entry: OpdsEntry): string | null {
  const acquisitions = getAcquisitionLinks(entry);
  return acquisitions[0]?.href ?? null;
}
