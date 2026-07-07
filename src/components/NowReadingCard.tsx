import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Book } from '../types/book';
import { BookCover } from './BookCover';
import { ReadingProgressBar } from './ReadingProgressBar';
import { useTheme } from '../theme';

type NowReadingCardProps = {
  book: Book;
  author?: string;
  progress: number;
  onPress: (book: Book) => void;
  onLongPress?: (book: Book) => void;
};

export function NowReadingCard({
  book,
  author,
  progress,
  onPress,
  onLongPress,
}: NowReadingCardProps) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      accessibilityHint="Long press for more options"
      accessibilityRole="button"
      onPress={() => onPress(book)}
      onLongPress={onLongPress ? () => onLongPress(book) : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLowest,
          shadowColor: '#000',
          opacity: pressed ? 0.98 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}>
      <View style={styles.coverWrap}>
        <BookCover book={book} />
      </View>
      <View style={styles.body}>
        <View>
          <View style={styles.badge}>
            <Text style={[typography.caption, styles.badgeText, { color: colors.primary }]}>
              Now Reading
            </Text>
          </View>
          <Text style={[typography.headlineLg, { color: colors.onSurface }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text
            style={[
              typography.body,
              styles.author,
              { color: colors.onSurfaceVariant, fontStyle: 'italic' },
            ]}
            numberOfLines={1}>
            {author ?? 'Unknown author'}
          </Text>
        </View>
        <View style={styles.progressSection}>
          <ReadingProgressBar progress={progress} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  coverWrap: {
    height: 288,
    overflow: 'hidden',
    width: '100%',
  },
  body: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67, 82, 165, 0.1)',
    borderRadius: 999,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  author: {
    marginTop: 4,
  },
  progressSection: {
    marginTop: 32,
  },
});
