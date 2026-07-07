import { Share } from 'react-native';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import { FileSystem, Dirs } from 'react-native-file-access';
import type { Book } from '../types/book';
import { loadBookmarks } from './bookBookmarks';
import { loadHighlights } from './bookAnnotations';

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

export async function buildAnnotationsMarkdown(book: Book): Promise<string> {
  const [bookmarks, highlights] = await Promise.all([
    loadBookmarks(book.id),
    loadHighlights(book.id),
  ]);

  const lines: string[] = [
    `# ${book.title}`,
    '',
    book.author ? `Author: ${book.author}` : '',
    '',
    '## Bookmarks',
    '',
  ];

  if (bookmarks.length === 0) {
    lines.push('_No bookmarks._', '');
  } else {
    for (const bookmark of bookmarks) {
      lines.push(`- ${bookmark.label} (${Math.round(bookmark.progress * 100)}%)`);
    }
    lines.push('');
  }

  lines.push('## Highlights', '');

  if (highlights.length === 0) {
    lines.push('_No highlights._');
  } else {
    for (const highlight of highlights) {
      const text = String(highlight.extras?.selectedText ?? '').trim();
      const note = String(highlight.extras?.note ?? '').trim();
      if (text) {
        lines.push(`> ${text}`);
      }
      if (note) {
        lines.push(`> _Note: ${note}_`);
      }
      lines.push('');
    }
  }

  return lines.filter(Boolean).join('\n');
}

export async function buildAnnotationsJson(book: Book): Promise<string> {
  const [bookmarks, highlights] = await Promise.all([
    loadBookmarks(book.id),
    loadHighlights(book.id),
  ]);
  return JSON.stringify({ bookId: book.id, title: book.title, bookmarks, highlights }, null, 2);
}

export async function shareAnnotationsMarkdown(book: Book): Promise<void> {
  const markdown = await buildAnnotationsMarkdown(book);
  await Share.share({
    title: `${book.title} — notes`,
    message: markdown,
  });
}

export async function exportAnnotationsToFile(book: Book, format: 'md' | 'json'): Promise<void> {
  const ext = format === 'md' ? 'md' : 'json';
  const safeTitle = book.title.replace(/[^\w.\-() ]+/g, '_').trim() || 'book';
  const fileName = `${safeTitle}-annotations.${ext}`;
  const path = `${Dirs.CacheDir}/${Date.now()}_${fileName}`;
  const content =
    format === 'md' ? await buildAnnotationsMarkdown(book) : await buildAnnotationsJson(book);
  await FileSystem.writeFile(path, content, 'utf8');
  await Share.share({
    title: fileName,
    url: `file://${path}`,
    message: content,
  });
}

export async function exportFullBackupToShare(json: string): Promise<void> {
  const path = `${Dirs.CacheDir}/freeder-backup-${Date.now()}.json`;
  await FileSystem.writeFile(path, json, 'utf8');
  await Share.share({
    title: 'FReeder backup',
    url: `file://${path}`,
    message: json,
  });
}

export async function pickBackupFileUri(): Promise<string | null> {
  const [file] = await pick({
    mode: 'open',
    type: [types.json, types.plainText, types.allFiles],
  });
  if (!file?.uri) {
    return null;
  }
  const [copy] = await keepLocalCopy({
    files: [{ uri: file.uri, fileName: file.name ?? 'freeder-backup.json' }],
    destination: 'cachesDirectory',
  });
  return copy?.localUri ?? file.uri;
}
