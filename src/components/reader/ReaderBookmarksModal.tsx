import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { Locator } from 'react-native-readium';
import type { BookBookmark } from '../../services/bookBookmarks';
import { useTheme } from '../../theme';

type ReaderBookmarksModalProps = {
  visible: boolean;
  bookmarks: BookBookmark[];
  currentProgress: number;
  onClose: () => void;
  onAddBookmark: () => void;
  onSelect: (locator: Locator) => void;
  onDelete: (bookmarkId: string) => void;
};

export function ReaderBookmarksModal({
  visible,
  bookmarks,
  currentProgress,
  onClose,
  onAddBookmark,
  onSelect,
  onDelete,
}: ReaderBookmarksModalProps) {
  const { colors, typography } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>Bookmarks</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Close</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onAddBookmark}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: pressed ? colors.primaryContainer : colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
              },
            ]}>
            <Icon name="bookmark-add" size={20} color={colors.primary} />
            <Text style={[typography.button, { color: colors.primary }]}>
              Save bookmark ({Math.round(currentProgress * 100)}%)
            </Text>
          </Pressable>

          <ScrollView contentContainerStyle={styles.list}>
            {bookmarks.length === 0 ? (
              <Text style={[typography.body, styles.empty, { color: colors.onSurfaceVariant }]}>
                No bookmarks yet. Save your current page to return later.
              </Text>
            ) : (
              bookmarks.map(bookmark => (
                <View
                  key={bookmark.id}
                  style={[styles.item, { borderColor: colors.outlineVariant }]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      onSelect(bookmark.locator);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.itemBody,
                      pressed && { backgroundColor: colors.surfaceContainerHigh },
                    ]}>
                    <Text
                      numberOfLines={2}
                      style={[typography.body, { color: colors.onSurface, flex: 1 }]}>
                      {bookmark.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                      {Math.round(bookmark.progress * 100)}%
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Delete bookmark"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => onDelete(bookmark.id)}
                    style={styles.deleteButton}>
                    <Icon name="delete-outline" size={20} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
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
    maxHeight: '75%',
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
  addButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 14,
  },
  list: {
    gap: 8,
    paddingBottom: 16,
  },
  empty: {
    paddingVertical: 24,
    textAlign: 'center',
  },
  item: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
