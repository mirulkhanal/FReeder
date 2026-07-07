import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

import type { ReaderSearchResult } from '../../hooks/useReaderSearch';
import type { Locator } from 'react-native-readium';

type ReaderSearchModalProps = {
  visible: boolean;
  results: ReaderSearchResult[];
  isSearching: boolean;
  isLoadingMore: boolean;
  isSupported: boolean;
  hasMore: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onLoadMore: () => void;
  onClear: () => void;
  onSelectResult: (locator: Locator) => void;
};

export function ReaderSearchModal({
  visible,
  results,
  isSearching,
  isLoadingMore,
  isSupported,
  hasMore,
  onClose,
  onSearch,
  onLoadMore,
  onClear,
  onSelectResult,
}: ReaderSearchModalProps) {
  const { colors, typography } = useTheme();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setHasSearched(true);
    onSearch(trimmed);
  }, [onSearch, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    onClear();
  }, [onClear]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderResult = useCallback(
    ({ item }: { item: ReaderSearchResult; index: number }) => {
      const highlight = item.highlight ?? item.locator.text?.highlight;
      const before = trimContext(item.before);
      const after = trimContext(item.after);
      const position = item.locator.locations?.position;
      const totalProgression = item.locator.locations?.totalProgression;
      const positionLabel =
        position != null
          ? `p. ${position}`
          : totalProgression != null
          ? `${Math.round(totalProgression * 100)}%`
          : null;

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onSelectResult(item.locator);
            handleClose();
          }}
          style={({ pressed }) => [
            styles.resultItem,
            pressed && { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Text
            style={[
              typography.body,
              styles.resultText,
              { color: colors.onSurface },
            ]}
          >
            {before ? (
              <Text style={{ color: colors.onSurfaceVariant }}>{before}</Text>
            ) : null}
            {highlight ? (
              <Text
                style={[styles.resultHighlight, { color: colors.onSurface }]}
              >
                {highlight}
              </Text>
            ) : (
              <Text>{query}</Text>
            )}
            {after ? (
              <Text style={{ color: colors.onSurfaceVariant }}>{after}</Text>
            ) : null}
          </Text>
          {positionLabel ? (
            <Text
              style={[typography.caption, { color: colors.onSurfaceVariant }]}
            >
              {positionLabel}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [
      colors.onSurface,
      colors.onSurfaceVariant,
      colors.surfaceContainerHigh,
      handleClose,
      onSelectResult,
      query,
      typography.body,
      typography.caption,
    ],
  );

  const listEmpty = () => {
    if (!isSupported) {
      return (
        <View style={styles.empty}>
          <Text
            style={[
              typography.body,
              { color: colors.onSurfaceVariant, textAlign: 'center' },
            ]}
          >
            Search is not available for this book.
          </Text>
        </View>
      );
    }
    if (isSearching) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
            Searching…
          </Text>
        </View>
      );
    }
    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.empty}>
          <Text
            style={[
              typography.body,
              { color: colors.onSurfaceVariant, textAlign: 'center' },
            ]}
          >
            No matches for "{query.trim()}"
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text
          style={[
            typography.body,
            { color: colors.onSurfaceVariant, textAlign: 'center' },
          ]}
        >
          Search inside this book
        </Text>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>
              Search
            </Text>
            <Pressable accessibilityRole="button" onPress={handleClose}>
              <Text style={[typography.button, { color: colors.primary }]}>
                Close
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Icon name="search" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              accessibilityLabel="Search query"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="Word or phrase"
              placeholderTextColor={colors.onSurfaceVariant}
              returnKeyType="search"
              style={[
                typography.body,
                styles.input,
                { color: colors.onSurface },
              ]}
              value={query}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleClear}
              >
                <Icon name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleSubmit}
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
            >
              <Icon name="arrow-forward" size={18} color={colors.onPrimary} />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={styles.list}
            data={results}
            keyExtractor={(item, index) =>
              `${item.locator.href}-${
                item.locator.locations?.progression ?? index
              }`
            }
            ListEmptyComponent={listEmpty}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.footerSpinner}
                />
              ) : null
            }
            onEndReached={() => {
              if (hasMore && !isLoadingMore) {
                onLoadMore();
              }
            }}
            onEndReachedThreshold={0.4}
            renderItem={renderResult}
          />
        </View>
      </View>
    </Modal>
  );
}

function trimContext(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (normalized.length <= 50) {
    return normalized;
  }
  return `…${normalized.slice(-50)}`;
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  searchButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  resultItem: {
    borderRadius: 10,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  resultText: {
    lineHeight: 22,
  },
  resultHighlight: {
    backgroundColor: 'rgba(255, 243, 163, 0.6)',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  footerSpinner: {
    paddingVertical: 16,
  },
});
