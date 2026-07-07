import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  createCollection,
  deleteCollection,
  renameCollection,
  setBookCollections,
  type BookCollection,
} from '../../services/collectionsStorage';
import { showThemedDialog } from '../../services/themedDialog';
import type { Book } from '../../types/book';
import { useTheme } from '../../theme';

type CollectionsModalProps = {
  visible: boolean;
  book?: Book | null;
  collections: BookCollection[];
  onClose: () => void;
  onCollectionsChange: (collections: BookCollection[]) => void;
};

export function CollectionsModal({
  visible,
  book = null,
  collections,
  onClose,
  onCollectionsChange,
}: CollectionsModalProps) {
  const { colors, typography } = useTheme();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      return;
    }

    setNewName('');
    setEditingId(null);
    setEditingName('');

    if (book) {
      const ids = new Set(
        collections.filter(collection => collection.bookIds.includes(book.id)).map(c => c.id),
      );
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  }, [book, collections, visible]);

  const handleClose = () => {
    onClose();
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      return;
    }

    void createCollection(trimmed).then(updated => {
      onCollectionsChange(updated);
      setNewName('');
    });
  };

  const handleStartEdit = (collection: BookCollection) => {
    setEditingId(collection.id);
    setEditingName(collection.name);
  };

  const handleSaveEdit = () => {
    if (!editingId) {
      return;
    }

    void renameCollection(editingId, editingName).then(updated => {
      onCollectionsChange(updated);
      setEditingId(null);
      setEditingName('');
    });
  };

  const handleDelete = (collection: BookCollection) => {
    showThemedDialog({
      title: 'Delete collection?',
      message: `"${collection.name}" will be removed. Books in this collection will stay in your library.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteCollection(collection.id).then(updated => {
              onCollectionsChange(updated);
              setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(collection.id);
                return next;
              });
            });
          },
        },
      ],
    });
  };

  const toggleSelection = (collectionId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleSaveBook = () => {
    if (!book) {
      handleClose();
      return;
    }

    void setBookCollections(book.id, [...selectedIds]).then(updated => {
      onCollectionsChange(updated);
      handleClose();
    });
  };

  const title = book ? `Add to collection` : 'Manage collections';

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={handleClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </View>

          {book ? (
            <Text style={[typography.body, styles.bookTitle, { color: colors.onSurfaceVariant }]}>
              {book.title}
            </Text>
          ) : null}

          <View style={styles.createRow}>
            <TextInput
              onChangeText={setNewName}
              placeholder="New collection name"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[
                typography.body,
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              value={newName}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!newName.trim()}
              onPress={handleCreate}
              style={[
                styles.createButton,
                {
                  backgroundColor: newName.trim() ? colors.primary : colors.surfaceContainerHigh,
                },
              ]}>
              <Icon
                name="add"
                size={22}
                color={newName.trim() ? colors.onPrimary : colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {collections.length === 0 ? (
              <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
                No collections yet. Create one above.
              </Text>
            ) : (
              collections.map(collection => {
                const isEditing = editingId === collection.id;
                const isSelected = selectedIds.has(collection.id);

                return (
                  <View
                    key={collection.id}
                    style={[
                      styles.collectionRow,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.outlineVariant,
                      },
                    ]}>
                    {book ? (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => toggleSelection(collection.id)}
                        style={styles.checkboxArea}>
                        <Icon
                          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                          size={24}
                          color={isSelected ? colors.primary : colors.onSurfaceVariant}
                        />
                      </Pressable>
                    ) : null}

                    {isEditing ? (
                      <TextInput
                        autoFocus
                        onChangeText={setEditingName}
                        style={[
                          typography.body,
                          styles.editInput,
                          {
                            backgroundColor: colors.surfaceContainerLowest,
                            borderColor: colors.outlineVariant,
                            color: colors.onSurface,
                          },
                        ]}
                        value={editingName}
                      />
                    ) : (
                      <View style={styles.collectionMeta}>
                        <Text style={[typography.titleMd, { color: colors.onSurface }]}>
                          {collection.name}
                        </Text>
                        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                          {collection.bookIds.length} book
                          {collection.bookIds.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.actions}>
                      {isEditing ? (
                        <Pressable accessibilityRole="button" onPress={handleSaveEdit}>
                          <Icon name="check" size={22} color={colors.primary} />
                        </Pressable>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleStartEdit(collection)}>
                          <Icon name="edit" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                      )}
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleDelete(collection)}>
                        <Icon name="delete-outline" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {book ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleSaveBook}
              style={[styles.submit, { backgroundColor: colors.primary }]}>
              <Text style={[typography.button, { color: colors.onPrimary }]}>Save</Text>
            </Pressable>
          ) : null}
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
    maxHeight: '88%',
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
  bookTitle: {
    marginBottom: 16,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createButton: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    width: 48,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  collectionRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  checkboxArea: {
    paddingRight: 4,
  },
  collectionMeta: {
    flex: 1,
    gap: 2,
  },
  editInput: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  submit: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 16,
  },
});
