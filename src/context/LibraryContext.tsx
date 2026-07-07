import {
  pick,
  pickDirectory,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  clearLibraryKeepingFiles,
  deleteBookFromDevice,
  removeBookFromLibrary,
} from '../services/bookDeletion';
import { enrichBooksInBackground } from '../services/bookEnrichment';
import { getCachedCoverUri, isCoverUriValid } from '../services/epubCover';
import {
  bookFromPickedFile,
  mergeScannedWithLibrary,
} from '../services/libraryMerge';
import {
  scanLibraryFolder,
  isSupportedBookFileName,
} from '../services/libraryScanner';
import {
  loadCachedBooks,
  loadLibraryFolderUri,
  saveCachedBooks,
  saveLibraryFolderUri,
} from '../services/libraryStorage';

import type { Book } from '../types/book';

type LibraryContextValue = {
  books: Book[];
  folderUri: string | null;
  isLoading: boolean;
  isSelectingFolder: boolean;
  selectLibraryFolder: () => Promise<void>;
  importSingleBook: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  reextractCovers: () => void;
  deleteBook: (book: Book) => Promise<void>;
  removeBook: (book: Book) => Promise<void>;
  relocateBook: (book: Book) => Promise<void>;
  clearLibrary: () => Promise<void>;
  importOpdsBook: (params: {
    fileUrl: string;
    fileName: string;
    title: string;
    author?: string;
  }) => Promise<void>;
  importIncomingBook: (book: Book) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [folderUri, setFolderUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const enrichingRef = useRef(false);
  const booksRef = useRef(books);
  booksRef.current = books;

  const enrichBooks = useCallback((bookList: Book[]) => {
    if (bookList.length === 0 || enrichingRef.current) {
      return;
    }

    enrichingRef.current = true;
    void enrichBooksInBackground(bookList, enriched => {
      setBooks(prev => {
        const next = prev.map(book =>
          book.id === enriched.id ? { ...book, ...enriched } : book,
        );
        void saveCachedBooks(next);
        return next;
      });
    }).finally(() => {
      enrichingRef.current = false;
    });
  }, []);

  const finalizeBooks = useCallback(
    async (merged: Book[]) => {
      const withCovers = await Promise.all(
        merged.map(async book => {
          const storedCover = book.coverUri;
          const coverUri =
            storedCover && (await isCoverUriValid(storedCover))
              ? storedCover
              : (await getCachedCoverUri(book.fileUrl)) ?? undefined;
          return coverUri ? { ...book, coverUri } : book;
        }),
      );

      setBooks(withCovers);
      await saveCachedBooks(withCovers);
      enrichBooks(withCovers.filter(book => !book.coverUri));
    },
    [enrichBooks],
  );

  const applyScan = useCallback(
    async (uri: string) => {
      const [scanned, cached] = await Promise.all([
        scanLibraryFolder(uri),
        loadCachedBooks(),
      ]);
      const merged = await mergeScannedWithLibrary(scanned, cached);
      await finalizeBooks(merged);
    },
    [finalizeBooks],
  );

  const reextractCovers = useCallback(() => {
    if (enrichingRef.current) {
      return;
    }

    setBooks(prev => {
      const missing = prev.filter(book => !book.coverUri);
      if (missing.length > 0) {
        enrichBooks(missing);
      }
      return prev;
    });
  }, [enrichBooks]);

  const refreshLibrary = useCallback(async () => {
    if (!folderUri) {
      return;
    }
    setIsLoading(true);
    try {
      await applyScan(folderUri);
    } finally {
      setIsLoading(false);
    }
  }, [applyScan, folderUri]);

  const selectLibraryFolder = useCallback(async () => {
    setIsSelectingFolder(true);
    try {
      const result = await pickDirectory({ requestLongTermAccess: true });
      if (!result?.uri) {
        return;
      }

      await saveLibraryFolderUri(result.uri);
      setFolderUri(result.uri);
      setIsLoading(true);
      await applyScan(result.uri);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      throw error;
    } finally {
      setIsSelectingFolder(false);
      setIsLoading(false);
    }
  }, [applyScan]);

  const importSingleBook = useCallback(async () => {
    setIsSelectingFolder(true);
    try {
      const [result] = await pick({
        mode: 'open',
        type: [types.allFiles],
        requestLongTermAccess: true,
      });
      if (!result?.uri) {
        return;
      }

      const fileName = result.name ?? 'book.epub';
      if (!isSupportedBookFileName(fileName)) {
        throw new Error('FReeder supports EPUB files only.');
      }

      const pickedBook = bookFromPickedFile(result.uri, fileName);
      const merged = await mergeScannedWithLibrary(
        [
          {
            fileUrl: pickedBook.fileUrl,
            fileName: pickedBook.fileName,
            title: pickedBook.title,
          },
        ],
        books,
      );
      await finalizeBooks(merged);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      throw error;
    } finally {
      setIsSelectingFolder(false);
    }
  }, [books, finalizeBooks]);

  const deleteBook = useCallback(async (book: Book) => {
    await deleteBookFromDevice(book);
    setBooks(prev => {
      const next = prev.filter(entry => entry.id !== book.id);
      void saveCachedBooks(next);
      return next;
    });
  }, []);

  const removeBook = useCallback(async (book: Book) => {
    await removeBookFromLibrary(book);
    setBooks(prev => {
      const next = prev.filter(entry => entry.id !== book.id);
      void saveCachedBooks(next);
      return next;
    });
  }, []);

  const relocateBook = useCallback(async (book: Book) => {
    const [result] = await pick({
      mode: 'open',
      type: [types.plainText, types.allFiles],
      requestLongTermAccess: true,
    });
    if (!result?.uri) {
      return;
    }

    const fileName = result.name ?? book.fileName;
    if (!isSupportedBookFileName(fileName)) {
      throw new Error('Please choose an EPUB file.');
    }

    setBooks(prev => {
      const next = prev.map(entry =>
        entry.id === book.id
          ? {
              ...entry,
              fileUrl: result.uri,
              fileName,
              missing: false,
            }
          : entry,
      );
      void saveCachedBooks(next);
      return next;
    });
  }, []);

  const clearLibrary = useCallback(async () => {
    try {
      await clearLibraryKeepingFiles(booksRef.current);
    } finally {
      setBooks([]);
      setFolderUri(null);
    }
  }, []);

  const importOpdsBook = useCallback(
    async (params: {
      fileUrl: string;
      fileName: string;
      title: string;
      author?: string;
    }) => {
      const merged = await mergeScannedWithLibrary(
        [
          {
            fileUrl: params.fileUrl,
            fileName: params.fileName,
            title: params.title,
            author: params.author,
          },
        ],
        booksRef.current,
      );
      await finalizeBooks(merged);
    },
    [finalizeBooks],
  );

  const importIncomingBook = useCallback(
    async (book: Book) => {
      const merged = await mergeScannedWithLibrary(
        [
          {
            fileUrl: book.fileUrl,
            fileName: book.fileName,
            title: book.title,
            author: book.author,
          },
        ],
        booksRef.current,
      );
      await finalizeBooks(merged);
    },
    [finalizeBooks],
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [storedUri, cachedBooks] = await Promise.all([
          loadLibraryFolderUri(),
          loadCachedBooks(),
        ]);

        if (!mounted) {
          return;
        }

        if (storedUri) {
          setFolderUri(storedUri);
          setBooks(cachedBooks);
          await applyScan(storedUri);
        } else if (cachedBooks.length > 0) {
          setBooks(cachedBooks);
          await finalizeBooks(cachedBooks);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applyScan, finalizeBooks]);

  const value = useMemo(
    () => ({
      books,
      folderUri,
      isLoading,
      isSelectingFolder,
      selectLibraryFolder,
      importSingleBook,
      refreshLibrary,
      reextractCovers,
      deleteBook,
      removeBook,
      relocateBook,
      clearLibrary,
      importOpdsBook,
      importIncomingBook,
    }),
    [
      books,
      folderUri,
      isLoading,
      isSelectingFolder,
      selectLibraryFolder,
      importSingleBook,
      refreshLibrary,
      reextractCovers,
      deleteBook,
      removeBook,
      relocateBook,
      clearLibrary,
      importOpdsBook,
      importIncomingBook,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return ctx;
}
