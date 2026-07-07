import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../theme';
import {
  filterBooks,
  filterByCollection,
  getBookAuthor,
  getNowReadingBook,
  searchBooks,
  sortBooks,
} from '../utils/libraryFilters';

import { BookGridItem, ImportBookTile } from './BookGridItem';
import { CollectionChips } from './CollectionChips';
import { FilterChips, type LibraryFilter } from './FilterChips';
import { NowReadingCard } from './NowReadingCard';
import { SortChips, type LibrarySort } from './SortChips';

import type { BookCollection } from '../services/collectionsStorage';
import type { ReadingState } from '../services/readingProgress';
import type { Book } from '../types/book';

type LibraryContentProps = {
  books: Book[];
  states: Record<string, ReadingState>;
  collections: BookCollection[];
  importing?: boolean;
  searchQuery?: string;
  onOpenBook: (book: Book) => void;
  onImportPress: () => void;
  onBookLongPress: (book: Book) => void;
  onRelocateBook: (book: Book) => void;
  onManageCollections: () => void;
};

export function LibraryContent({
  books,
  states,
  collections,
  importing = false,
  searchQuery = '',
  onOpenBook,
  onImportPress,
  onBookLongPress,
  onRelocateBook,
  onManageCollections,
}: LibraryContentProps) {
  const { colors, typography } = useTheme();
  const { refreshLibrary } = useLibrary();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [sort, setSort] = useState<LibrarySort>('title');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  const visibleBooks = useMemo(
    () => searchBooks(books, searchQuery, states),
    [books, searchQuery, states],
  );

  const nowReading = useMemo(
    () => getNowReadingBook(visibleBooks, states),
    [visibleBooks, states],
  );

  const filteredBooks = useMemo(() => {
    const byStatus = filterBooks(visibleBooks, filter, states);
    const byCollection = filterByCollection(
      byStatus,
      activeCollectionId,
      collections,
    );
    return sortBooks(byCollection, sort, states);
  }, [visibleBooks, filter, sort, states, activeCollectionId, collections]);

  const nowReadingProgress = nowReading
    ? states[nowReading.id]?.progress ?? 0
    : 0;

  const missingCount = books.filter(book => book.missing).length;

  const gridRows = useMemo(() => {
    const rows: Book[][] = [];
    for (let i = 0; i < filteredBooks.length; i += 2) {
      rows.push(filteredBooks.slice(i, i + 2));
    }
    return rows;
  }, [filteredBooks]);

  const handleOpenBook = (book: Book) => {
    if (book.missing) {
      onRelocateBook(book);
      return;
    }
    onOpenBook(book);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLibrary();
    } finally {
      setRefreshing(false);
    }
  }, [refreshLibrary]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={() => {
            void handleRefresh();
          }}
          refreshing={refreshing}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.section}>
        <Text style={[typography.displayTitle, { color: colors.onSurface }]}>
          Welcome back, Reader
        </Text>
        <Text
          style={[
            typography.body,
            styles.subtitle,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Pick up where you left off
        </Text>
      </View>

      {missingCount > 0 ? (
        <View
          style={[
            styles.missingBanner,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.onSurface }]}>
            {missingCount} book{missingCount === 1 ? '' : 's'} need to be
            located again.
          </Text>
          <Text
            style={[typography.caption, { color: colors.onSurfaceVariant }]}
          >
            Tap a missing book or re-select your library folder if access was
            revoked.
          </Text>
        </View>
      ) : null}

      {nowReading && !nowReading.missing ? (
        <View style={styles.section}>
          <NowReadingCard
            book={nowReading}
            author={getBookAuthor(nowReading, states)}
            progress={nowReadingProgress}
            onPress={handleOpenBook}
            onLongPress={onBookLongPress}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <FilterChips active={filter} onChange={setFilter} />
        <CollectionChips
          activeCollectionId={activeCollectionId}
          collections={collections}
          onChange={setActiveCollectionId}
          onManagePress={onManageCollections}
        />
        <SortChips active={sort} onChange={setSort} />
      </View>

      {searchQuery.trim() && filteredBooks.length === 0 ? (
        <View style={styles.emptySearch}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
            No books match "{searchQuery.trim()}".
          </Text>
        </View>
      ) : null}

      <View style={styles.gridSection}>
        {gridRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map(book => {
              const state = states[book.id];
              return (
                <BookGridItem
                  key={book.id}
                  book={book}
                  author={getBookAuthor(book, states)}
                  progress={state?.progress ?? 0}
                  hasReadingActivity={Boolean(state?.lastOpenedAt)}
                  missing={book.missing}
                  onPress={handleOpenBook}
                  onLongPress={onBookLongPress}
                />
              );
            })}
            {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
          </View>
        ))}
        <View style={styles.gridRow}>
          <ImportBookTile loading={importing} onPress={onImportPress} />
          <View style={styles.gridSpacer} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  section: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
  },
  missingBanner: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginBottom: 32,
    padding: 16,
  },
  gridSection: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridSpacer: {
    flex: 1,
  },
  emptySearch: {
    marginBottom: 24,
  },
});
