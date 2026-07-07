import type { LibraryFilter } from '../components/FilterChips';
import type { LibrarySort } from '../components/SortChips';
import type { BookCollection } from '../services/collectionsStorage';
import type { ReadingState } from '../services/readingProgress';
import { isBookFinished, isBookInProgress } from '../services/readingProgress';
import type { Book } from '../types/book';

export function getNowReadingBook(
  books: Book[],
  states: Record<string, ReadingState>,
): Book | null {
  const available = books.filter(book => !book.missing);
  if (available.length === 0) {
    return null;
  }

  const ranked = available
    .map(book => ({ book, state: states[book.id] }))
    .filter(entry => entry.state?.lastOpenedAt)
    .sort((a, b) => (b.state!.lastOpenedAt - a.state!.lastOpenedAt));

  return ranked[0]?.book ?? available[0];
}

export function getBookAuthor(
  book: Book,
  states: Record<string, ReadingState>,
): string | undefined {
  return states[book.id]?.author ?? book.author;
}

export function filterByCollection(
  books: Book[],
  collectionId: string | null,
  collections: BookCollection[],
): Book[] {
  if (!collectionId) {
    return books;
  }

  const collection = collections.find(entry => entry.id === collectionId);
  if (!collection) {
    return books;
  }

  const bookIds = new Set(collection.bookIds);
  return books.filter(book => bookIds.has(book.id));
}

export function filterBooks(
  books: Book[],
  filter: LibraryFilter,
  states: Record<string, ReadingState>,
): Book[] {
  switch (filter) {
    case 'reading':
      return books.filter(book => isBookInProgress(states[book.id]));
    case 'favorites':
      return books.filter(book => states[book.id]?.favorite);
    case 'finished':
      return books.filter(book => isBookFinished(states[book.id]));
    case 'unread':
      return books.filter(book => {
        const state = states[book.id];
        return !isBookInProgress(state) && !isBookFinished(state);
      });
    case 'series':
      return books.filter(book => Boolean(book.series?.trim()));
    case 'all':
    default:
      return books;
  }
}

export function sortBooks(
  books: Book[],
  sort: LibrarySort,
  states: Record<string, ReadingState>,
): Book[] {
  const list = [...books];
  switch (sort) {
    case 'author':
      return list.sort((a, b) => {
        const authorA = (getBookAuthor(a, states) ?? '').toLowerCase();
        const authorB = (getBookAuthor(b, states) ?? '').toLowerCase();
        if (authorA !== authorB) {
          return authorA.localeCompare(authorB);
        }
        return a.title.localeCompare(b.title);
      });
    case 'recent':
      return list.sort(
        (a, b) =>
          (states[b.id]?.lastOpenedAt ?? 0) - (states[a.id]?.lastOpenedAt ?? 0),
      );
    case 'added':
      return list.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
    case 'title':
    default:
      return list.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function searchBooks(
  books: Book[],
  query: string,
  states: Record<string, ReadingState>,
): Book[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return books;
  }

  return books.filter(book => {
    const author = (states[book.id]?.author ?? book.author ?? '').toLowerCase();
    const title = book.title.toLowerCase();
    const fileName = book.fileName.toLowerCase();
    return (
      title.includes(trimmed) ||
      author.includes(trimmed) ||
      fileName.includes(trimmed)
    );
  });
}
