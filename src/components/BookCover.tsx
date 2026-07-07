import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Book } from '../types/book';
import { isCoverUriValid } from '../services/epubCover';
import { useTheme } from '../theme';

const COVER_PALETTES = [
  { bg: '#4352a5', text: '#f8f6ff' },
  { bg: '#546067', text: '#ffffff' },
  { bg: '#5c6bc0', text: '#f8f6ff' },
  { bg: '#775200', text: '#fff6ee' },
  { bg: '#3c494f', text: '#d7e4ec' },
] as const;

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return hash;
}

type BookCoverProps = {
  book: Book;
};

export function BookCover({ book }: BookCoverProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const palette = COVER_PALETTES[hashTitle(book.title) % COVER_PALETTES.length];
  const initial = (book.title.trim()[0] ?? '?').toUpperCase();

  useEffect(() => {
    let mounted = true;

    setImageFailed(false);

    if (!book.coverUri) {
      return () => {
        mounted = false;
      };
    }

    void isCoverUriValid(book.coverUri).then(valid => {
      if (mounted && !valid) {
        setImageFailed(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [book.coverUri]);

  if (book.coverUri && !imageFailed) {
    return (
      <Image
        key={book.coverUri}
        source={{ uri: book.coverUri }}
        style={styles.cover}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.cover, styles.placeholder, { backgroundColor: palette.bg }]}>
      <Text style={[styles.initial, { color: palette.text }]}>{initial}</Text>
      <View style={[styles.spine, { backgroundColor: colors.surfaceContainerHighest }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 8,
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: '600',
  },
  spine: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
});
