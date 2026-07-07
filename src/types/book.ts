export type Book = {
  id: string;
  title: string;
  author?: string;
  series?: string;
  fileUrl: string;
  fileName: string;
  coverUri?: string;
  addedAt: number;
  contentHash?: string;
  /** File missing from library folder or permission revoked */
  missing?: boolean;
};

export function getBookFileName(book: Book): string {
  if (book.fileName?.toLowerCase().endsWith('.epub')) {
    return book.fileName;
  }

  try {
    const decoded = decodeURIComponent(book.fileUrl);
    const segment = decoded.split('/').pop();
    if (segment) {
      const nested = segment.includes('/') ? segment.split('/').pop() : segment;
      if (nested?.toLowerCase().endsWith('.epub')) {
        return nested;
      }
    }
  } catch {
    // Fall through to title-based name.
  }

  return `${book.title.replace(/\s+/g, ' ').trim() || 'book'}.epub`;
}

export function isLegacyPathBookId(id: string | undefined | null): boolean {
  if (!id) {
    return true;
  }
  return (
    id.startsWith('content://') ||
    id.startsWith('file://') ||
    id.startsWith('/')
  );
}

export function generateBookId(): string {
  return `book_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBookFromScan(entry: {
  fileUrl: string;
  fileName: string;
  title: string;
  author?: string;
}): Book {
  return {
    id: generateBookId(),
    title: entry.title,
    author: entry.author,
    fileUrl: entry.fileUrl,
    fileName: entry.fileName,
    addedAt: Date.now(),
    missing: false,
  };
}
