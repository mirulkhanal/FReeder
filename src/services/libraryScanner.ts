import { FileSystem, Util } from 'react-native-file-access';
import type { ScannedBookEntry } from './libraryMerge';

const EPUB_EXTENSION = '.epub';

function isEpubFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(EPUB_EXTENSION);
}

function titleFromFilename(filename: string): string {
  const base = Util.basename(filename).replace(/\.epub$/i, '');
  return base.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function scanDirectory(dirUri: string): Promise<ScannedBookEntry[]> {
  let entries;
  try {
    entries = await FileSystem.statDir(dirUri);
  } catch {
    return [];
  }

  const books: ScannedBookEntry[] = [];

  for (const entry of entries) {
    if (entry.type === 'directory') {
      books.push(...(await scanDirectory(entry.path)));
      continue;
    }

    if (!isEpubFile(entry.filename)) {
      continue;
    }

    books.push({
      title: titleFromFilename(entry.filename),
      fileUrl: entry.path,
      fileName: entry.filename,
    });
  }

  return books.sort((a, b) => a.title.localeCompare(b.title));
}

export async function scanLibraryFolder(folderUri: string): Promise<ScannedBookEntry[]> {
  return scanDirectory(folderUri);
}

export function isSupportedBookFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(EPUB_EXTENSION);
}
