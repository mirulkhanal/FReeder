import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

import type { Book } from '../../types/book';

export type BookActionId =
  | 'collection'
  | 'share'
  | 'export'
  | 'remove'
  | 'cancel';

type BookActionModalProps = {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onAction: (action: BookActionId) => void;
};

const ACTIONS: Array<{
  id: BookActionId;
  label: string;
  icon: string;
  destructive?: boolean;
}> = [
  {
    id: 'collection',
    label: 'Add to collection',
    icon: 'collections-bookmark',
  },
  { id: 'share', label: 'Share EPUB', icon: 'share' },
  { id: 'export', label: 'Export notes', icon: 'notes' },
  {
    id: 'remove',
    label: 'Remove book',
    icon: 'delete-outline',
    destructive: true,
  },
];

export function BookActionModal({
  visible,
  book,
  onClose,
  onAction,
}: BookActionModalProps) {
  const { colors, typography } = useTheme();

  if (!book) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityRole="none"
          onPress={event => event.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              typography.titleMd,
              styles.title,
              { color: colors.onSurface },
            ]}
          >
            {book.title}
          </Text>
          {book.author ? (
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                styles.author,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {book.author}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {ACTIONS.map(action => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                onPress={() => onAction(action.id)}
                style={({ pressed }) => [
                  styles.actionRow,
                  {
                    backgroundColor: pressed
                      ? colors.surfaceContainerHigh
                      : colors.surfaceContainerLow,
                  },
                ]}
              >
                <Icon
                  color={
                    action.destructive ? colors.error : colors.onSurfaceVariant
                  }
                  name={action.icon}
                  size={22}
                />
                <Text
                  style={[
                    typography.body,
                    {
                      color: action.destructive
                        ? colors.error
                        : colors.onSurface,
                      flex: 1,
                    },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: pressed
                  ? colors.surfaceContainerHigh
                  : colors.surfaceContainer,
              },
            ]}
          >
            <Text
              style={[typography.button, { color: colors.onSurfaceVariant }]}
            >
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 20,
    gap: 8,
    padding: 20,
  },
  title: {
    fontWeight: '600',
  },
  author: {
    marginBottom: 8,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 14,
  },
});
