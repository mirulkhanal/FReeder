import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { BookCover } from './BookCover';
import { ReadingProgressBar } from './ReadingProgressBar';

import type { Book } from '../types/book';

type BookGridItemProps = {
  book: Book;
  author?: string;
  progress?: number;
  hasReadingActivity?: boolean;
  missing?: boolean;
  onPress: (book: Book) => void;
  onLongPress?: (book: Book) => void;
};

export function BookGridItem({
  book,
  author,
  progress = 0,
  hasReadingActivity = false,
  missing = false,
  onPress,
  onLongPress,
}: BookGridItemProps) {
  const { colors, typography } = useTheme();
  const showProgress = !missing && (hasReadingActivity || progress > 0);

  return (
    <Pressable
      accessibilityHint="Long press for more options"
      accessibilityRole="button"
      onPress={() => onPress(book)}
      onLongPress={onLongPress ? () => onLongPress(book) : undefined}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View
        style={[
          styles.coverFrame,
          {
            shadowColor: '#000',
          },
        ]}
      >
        <BookCover book={book} />
        {missing ? (
          <View style={styles.missingOverlay}>
            <Text style={[typography.caption, styles.missingText]}>
              Missing file
            </Text>
            <Text style={[typography.caption, styles.missingHint]}>
              Tap to locate
            </Text>
          </View>
        ) : null}
        {showProgress ? (
          <View style={styles.progressOverlay}>
            <ReadingProgressBar
              progress={progress}
              variant="compact"
              showLabel={false}
              onDark
            />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text
          style={[typography.titleMd, { color: colors.onSurface }]}
          numberOfLines={1}
        >
          {book.title}
        </Text>
        <Text
          style={[typography.caption, { color: colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {missing ? 'Tap to locate file' : author ?? 'Unknown author'}
        </Text>
      </View>
    </Pressable>
  );
}

type ImportBookTileProps = {
  loading?: boolean;
  onPress: () => void;
};

export function ImportBookTile({ loading, onPress }: ImportBookTileProps) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed && !loading && styles.itemPressed,
      ]}
    >
      <View
        style={[
          styles.coverFrame,
          {
            shadowColor: '#000',
          },
        ]}
      >
        <View
          style={[
            styles.importInner,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <Text style={[styles.importPlus, { color: colors.outline }]}>+</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text
          style={[typography.titleMd, { color: colors.onSurface }]}
          numberOfLines={1}
        >
          Import Book
        </Text>
        <Text
          style={[typography.caption, { color: colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          Add EPUB file or folder
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    paddingBottom: 4,
  },
  itemPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  coverFrame: {
    aspectRatio: 3 / 4,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    width: '100%',
  },
  progressOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
  },
  missingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 8,
  },
  missingText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  missingHint: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  meta: {
    gap: 4,
    marginTop: 12,
  },
  importInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  importPlus: {
    fontSize: 40,
    fontWeight: '200',
    lineHeight: 44,
  },
});
