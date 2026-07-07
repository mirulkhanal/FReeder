import { hashBookFile } from './duplicateDetection';
import {
  extractEpubMetadata,
  getCachedCoverUri,
  isCoverUriValid,
} from './epubCover';

import type { Book } from '../types/book';

const ENRICH_CONCURRENCY = 1;

export async function enrichBook(book: Book): Promise<Book> {
  const hasValidCover = book.coverUri
    ? await isCoverUriValid(book.coverUri)
    : false;
  const bookToEnrich = hasValidCover ? book : { ...book, coverUri: undefined };

  let enriched = bookToEnrich;

  if (!enriched.contentHash && !enriched.missing) {
    const hash = await hashBookFile(enriched);
    if (hash) {
      enriched = { ...enriched, contentHash: hash };
    }
  }

  if (enriched.coverUri) {
    return enriched;
  }

  const cachedCover = await getCachedCoverUri(book.fileUrl);
  if (cachedCover) {
    return { ...enriched, coverUri: cachedCover };
  }

  try {
    const metadata = await extractEpubMetadata(
      enriched.fileUrl,
      enriched.fileName,
    );
    return {
      ...enriched,
      title: metadata.title ?? enriched.title,
      author: metadata.author ?? enriched.author,
      series: metadata.series ?? enriched.series,
      coverUri: metadata.coverUri ?? enriched.coverUri,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to enrich book cover:', book.fileName, error);
    }
    return enriched;
  }
}

export async function enrichBooksInBackground(
  books: Book[],
  onBookEnriched: (book: Book) => void,
): Promise<void> {
  let index = 0;

  const worker = async () => {
    while (index < books.length) {
      const current = index;
      index += 1;
      const book = books[current];
      const enriched = await enrichBook(book);

      if (
        enriched.coverUri !== book.coverUri ||
        enriched.title !== book.title ||
        enriched.author !== book.author ||
        enriched.series !== book.series ||
        enriched.contentHash !== book.contentHash
      ) {
        onBookEnriched(enriched);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(ENRICH_CONCURRENCY, books.length) }, worker),
  );
}
