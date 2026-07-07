import { useCallback, useRef, useState, type RefObject } from 'react';
import type { Locator, ReadiumViewRef } from 'react-native-readium';

export type ReaderSearchResult = {
  locator: Locator;
  highlight?: string;
  before?: string;
  after?: string;
};

type SearchPage = {
  results: ReaderSearchResult[];
  hasMore: boolean;
  isSupported?: boolean;
};

type SearchOptions = {
  caseSensitive?: boolean;
};

type ReadiumSearchCapable = ReadiumViewRef & {
  search?: (query: string, options?: SearchOptions) => Promise<SearchPage>;
  loadMoreSearchResults?: () => Promise<SearchPage>;
  cancelSearch?: () => void;
};

function searchRef(readerRef: RefObject<ReadiumViewRef | null>): ReadiumSearchCapable | null {
  return readerRef.current as ReadiumSearchCapable | null;
}

export function useReaderSearch(readerRef: RefObject<ReadiumViewRef | null>) {
  const [results, setResults] = useState<ReaderSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const loadingMoreRef = useRef(false);

  const search = useCallback(
    async (query: string, options?: SearchOptions) => {
      const reader = searchRef(readerRef);
      if (!reader?.search) {
        setIsSupported(false);
        setResults([]);
        setHasMore(false);
        return;
      }

      setIsSearching(true);
      setResults([]);
      setHasMore(false);

      try {
        const page = await reader.search(query, options);
        setResults(page.results);
        setHasMore(page.hasMore);
        setIsSupported(page.isSupported ?? true);
      } catch {
        setIsSupported(false);
        setResults([]);
        setHasMore(false);
      } finally {
        setIsSearching(false);
      }
    },
    [readerRef],
  );

  const loadMore = useCallback(async () => {
    const reader = searchRef(readerRef);
    if (!reader?.loadMoreSearchResults || loadingMoreRef.current || !hasMore) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await reader.loadMoreSearchResults();
      setResults(prev => [...prev, ...page.results]);
      setHasMore(page.hasMore);
      if (page.isSupported != null) {
        setIsSupported(page.isSupported);
      }
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, readerRef]);

  const clear = useCallback(() => {
    const reader = searchRef(readerRef);
    if (typeof reader?.cancelSearch === 'function') {
      reader.cancelSearch();
    }
    setResults([]);
    setHasMore(false);
    setIsSearching(false);
    setIsLoadingMore(false);
    loadingMoreRef.current = false;
  }, [readerRef]);

  return {
    results,
    isSearching,
    isLoadingMore,
    hasMore,
    isSupported,
    search,
    loadMore,
    clear,
  };
}
