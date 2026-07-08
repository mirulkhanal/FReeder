import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  findDuplicateBooks,
  findTitleSizeDuplicates,
  type DuplicateGroup,
} from '../../services/duplicateDetection';
import { useTheme } from '../../theme';
import { confirmRemoveDuplicate } from '../../utils/bookActions';
import { BookCover } from '../BookCover';

import type { Book } from '../../types/book';

type FindDuplicatesModalProps = {
  visible: boolean;
  books: Book[];
  onClose: () => void;
  onRemoveBook: (book: Book) => void;
};

type DuplicateSection = {
  id: string;
  label: string;
  books: Book[];
};

export function FindDuplicatesModal({
  visible,
  books,
  onClose,
  onRemoveBook,
}: FindDuplicatesModalProps) {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<DuplicateSection[]>([]);
  const [scanned, setScanned] = useState(false);

  const runScan = useCallback(async () => {
    if (books.length < 2) {
      setSections([]);
      setScanned(true);
      return;
    }

    setLoading(true);
    try {
      const [hashGroups, titleSizeGroups] = await Promise.all([
        findDuplicateBooks(books),
        findTitleSizeDuplicates(books),
      ]);

      const next: DuplicateSection[] = [
        ...hashGroups.map((group: DuplicateGroup, index) => ({
          id: `hash-${group.hash}-${index}`,
          label: 'Same file content',
          books: group.books,
        })),
        ...titleSizeGroups.map((group, index) => ({
          id: `title-size-${index}`,
          label: 'Same title and file size',
          books: group,
        })),
      ];

      setSections(next);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  }, [books]);

  const handleOpen = useCallback(() => {
    if (!visible) {
      return;
    }
    setScanned(false);
    setSections([]);
    void runScan();
  }, [runScan, visible]);

  React.useEffect(() => {
    if (visible) {
      handleOpen();
    }
  }, [handleOpen, visible]);

  const confirmRemove = (book: Book) => {
    void confirmRemoveDuplicate(book).then(confirmed => {
      if (!confirmed) {
        return;
      }
      onRemoveBook(book);
      void runScan();
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
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
              Duplicate books
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Icon color={colors.onSurfaceVariant} name="close" size={24} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={[
                  typography.body,
                  { color: colors.onSurfaceVariant, marginTop: 12 },
                ]}
              >
                Scanning library…
              </Text>
            </View>
          ) : scanned && sections.length === 0 ? (
            <View style={styles.centered}>
              <Icon color={colors.primary} name="check-circle" size={40} />
              <Text
                style={[
                  typography.body,
                  styles.emptyText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                No duplicate EPUBs found.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {sections.map(section => (
                <View key={section.id} style={styles.section}>
                  <Text style={[typography.caption, { color: colors.outline }]}>
                    {section.label.toUpperCase()}
                  </Text>
                  {section.books.map(book => (
                    <View
                      key={book.id}
                      style={[
                        styles.bookRow,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <View style={styles.coverWrap}>
                        <BookCover book={book} />
                      </View>
                      <View style={styles.bookCopy}>
                        <Text
                          numberOfLines={2}
                          style={[typography.body, { color: colors.onSurface }]}
                        >
                          {book.title}
                        </Text>
                        {book.author ? (
                          <Text
                            numberOfLines={1}
                            style={[
                              typography.caption,
                              { color: colors.onSurfaceVariant },
                            ]}
                          >
                            {book.author}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => confirmRemove(book)}
                        style={({ pressed }) => [
                          styles.removeButton,
                          {
                            backgroundColor: pressed
                              ? colors.surfaceContainerHigh
                              : colors.surfaceContainerHighest,
                          },
                        ]}
                      >
                        <Icon
                          color={colors.error}
                          name="delete-outline"
                          size={20}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  list: {
    gap: 20,
    paddingBottom: 24,
  },
  section: {
    gap: 8,
  },
  bookRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  coverWrap: {
    height: 64,
    width: 44,
  },
  bookCopy: {
    flex: 1,
    gap: 2,
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
