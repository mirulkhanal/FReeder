import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  BookActionModal,
  type BookActionId,
} from '../components/library/BookActionModal';
import { CollectionsModal } from '../components/library/CollectionsModal';
import { LibraryContent } from '../components/LibraryContent';
import { LibraryEmptyHero } from '../components/LibraryEmptyHero';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { useLibrary } from '../context/LibraryContext';
import { useReadingProgress } from '../hooks/useReadingProgress';
import {
  loadCollections,
  type BookCollection,
} from '../services/collectionsStorage';
import { showThemedAlert, showThemedDialog } from '../services/themedDialog';
import { useTheme } from '../theme';
import {
  exportBookNotes,
  promptDeleteBook,
  promptRelocateBook,
  shareEpub,
} from '../utils/bookActions';

import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import type { Book } from '../types/book';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'LibraryTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function LibraryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const {
    books,
    isLoading,
    isSelectingFolder,
    selectLibraryFolder,
    importSingleBook,
    deleteBook,
    removeBook,
    relocateBook,
  } = useLibrary();
  const { states, reload } = useReadingProgress();
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [collectionsModalVisible, setCollectionsModalVisible] = useState(false);
  const [collectionsModalBook, setCollectionsModalBook] = useState<Book | null>(
    null,
  );
  const [actionBook, setActionBook] = useState<Book | null>(null);

  const reloadCollections = useCallback(() => {
    void loadCollections().then(setCollections);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      reloadCollections();
    }, [reload, reloadCollections]),
  );

  const openSearch = useCallback(() => {
    setSearchActive(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery('');
  }, []);

  const handleDeleteBook = useCallback(
    (book: Book) => {
      promptDeleteBook(book, {
        onRemoveFromLibrary: () => {
          void (async () => {
            try {
              await removeBook(book);
              await reload();
              reloadCollections();
            } catch (error) {
              showThemedAlert(
                'Remove failed',
                error instanceof Error
                  ? error.message
                  : 'Could not remove this book.',
              );
            }
          })();
        },
        onDeleteFromDevice: () => {
          void (async () => {
            try {
              await deleteBook(book);
              await reload();
              reloadCollections();
            } catch (error) {
              showThemedAlert(
                'Delete failed',
                error instanceof Error
                  ? error.message
                  : 'Could not delete this book from your device.',
              );
            }
          })();
        },
      });
    },
    [deleteBook, reload, reloadCollections, removeBook],
  );

  const handleBookLongPress = useCallback((book: Book) => {
    setActionBook(book);
  }, []);

  const closeBookActions = useCallback(() => {
    setActionBook(null);
  }, []);

  const handleBookAction = useCallback(
    (action: BookActionId) => {
      const book = actionBook;
      if (!book) {
        return;
      }

      if (action === 'cancel') {
        closeBookActions();
        return;
      }

      closeBookActions();

      switch (action) {
        case 'collection':
          setCollectionsModalBook(book);
          setCollectionsModalVisible(true);
          break;
        case 'share':
          void shareEpub(book).catch(error => {
            showThemedAlert(
              'Share failed',
              error instanceof Error
                ? error.message
                : 'Could not share this EPUB.',
            );
          });
          break;
        case 'export':
          void exportBookNotes(book).catch(error => {
            showThemedAlert(
              'Export failed',
              error instanceof Error
                ? error.message
                : 'Could not export notes for this book.',
            );
          });
          break;
        case 'remove':
          handleDeleteBook(book);
          break;
      }
    },
    [actionBook, closeBookActions, handleDeleteBook],
  );

  const handleRelocateBook = useCallback(
    (book: Book) => {
      promptRelocateBook(book, () => {
        void (async () => {
          try {
            await relocateBook(book);
          } catch (error) {
            showThemedAlert(
              'Locate failed',
              error instanceof Error
                ? error.message
                : 'Could not locate this book.',
            );
          }
        })();
      });
    },
    [relocateBook],
  );

  const openBook = useCallback(
    (book: Book) => {
      if (book.missing) {
        handleRelocateBook(book);
        return;
      }
      navigation.navigate('Reader', { book });
    },
    [handleRelocateBook, navigation],
  );

  const handleImportPress = useCallback(() => {
    showThemedDialog({
      title: 'Import books',
      message: 'Choose how you want to add EPUB files.',
      buttons: [
        {
          text: 'Add EPUB file',
          onPress: () => {
            void (async () => {
              try {
                await importSingleBook();
              } catch (error) {
                showThemedAlert(
                  'Import failed',
                  error instanceof Error
                    ? error.message
                    : 'Could not import that file.',
                );
              }
            })();
          },
        },
        {
          text: 'Choose library folder',
          onPress: () => {
            void (async () => {
              try {
                await selectLibraryFolder();
              } catch (error) {
                showThemedAlert(
                  'Folder selection failed',
                  error instanceof Error
                    ? error.message
                    : 'Could not access that folder.',
                );
              }
            })();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    });
  }, [importSingleBook, selectLibraryFolder]);

  const handleSelectFolder = useCallback(async () => {
    try {
      await selectLibraryFolder();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not access that folder.';
      showThemedAlert('Folder selection failed', message);
    }
  }, [selectLibraryFolder]);

  const openManageCollections = useCallback(() => {
    setCollectionsModalBook(null);
    setCollectionsModalVisible(true);
  }, []);

  const closeCollectionsModal = useCallback(() => {
    setCollectionsModalVisible(false);
    setCollectionsModalBook(null);
  }, []);

  const showEmpty = books.length === 0;

  return (
    <TabScreenLayout
      onSearchPress={showEmpty ? undefined : openSearch}
      searchActive={searchActive}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearchClose={closeSearch}
    >
      {isLoading && !isSelectingFolder ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showEmpty ? (
        <LibraryEmptyHero
          loading={isSelectingFolder}
          onSelectFolder={handleSelectFolder}
          onImportFile={async () => {
            try {
              await importSingleBook();
            } catch (error) {
              showThemedAlert(
                'Import failed',
                error instanceof Error
                  ? error.message
                  : 'Could not import that file.',
              );
            }
          }}
        />
      ) : (
        <LibraryContent
          books={books}
          states={states}
          collections={collections}
          importing={isSelectingFolder}
          searchQuery={searchQuery}
          onOpenBook={openBook}
          onImportPress={handleImportPress}
          onBookLongPress={handleBookLongPress}
          onRelocateBook={handleRelocateBook}
          onManageCollections={openManageCollections}
        />
      )}

      <CollectionsModal
        visible={collectionsModalVisible}
        book={collectionsModalBook}
        collections={collections}
        onClose={closeCollectionsModal}
        onCollectionsChange={setCollections}
      />

      <BookActionModal
        book={actionBook}
        visible={actionBook !== null}
        onAction={handleBookAction}
        onClose={closeBookActions}
      />
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
