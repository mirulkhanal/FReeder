import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  AddCatalogModal,
  type CatalogFormValues,
} from '../components/discover/AddCatalogModal';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { useLibrary } from '../context/LibraryContext';
import { loadLibraryFolderUri } from '../services/libraryStorage';
import {
  fetchOpdsFeed,
  fetchOpenSearchTemplate,
  probeOpdsCatalog,
  resolveOpdsUrl,
} from '../services/opdsClient';
import {
  downloadOpdsEntry,
  pickAcquisitionUrl,
} from '../services/opdsDownload';
import {
  enqueueDownload,
  subscribeDownloadQueue,
  updateDownloadItem,
  type DownloadQueueItem,
} from '../services/opdsDownloadQueue';
import {
  buildSearchUrl,
  getNavigationLinks,
  getPublicationEntries,
  getThumbnailUrl,
  isDrmAcquisitionLink,
} from '../services/opdsParser';
import {
  addOpdsCatalog,
  loadOpdsCatalogs,
  removeOpdsCatalog,
  updateOpdsCatalog,
  SUGGESTED_CATALOGS,
} from '../services/opdsStorage';
import { showThemedAlert, showThemedDialog } from '../services/themedDialog';
import { useTheme } from '../theme';

import type { MainTabParamList } from '../navigation/types';
import type {
  OpdsCatalog,
  OpdsEntry,
  OpdsFeed,
  OpdsSearchTemplate,
} from '../types/opds';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type DiscoverNavigation = BottomTabNavigationProp<
  MainTabParamList,
  'DiscoverTab'
>;

type FeedState = {
  catalog: OpdsCatalog;
  url: string;
  title: string;
};

export function DiscoverScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const { colors, typography } = useTheme();
  const { importOpdsBook, folderUri, selectLibraryFolder } = useLibrary();

  const [catalogs, setCatalogs] = useState<OpdsCatalog[]>([]);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<OpdsCatalog | null>(
    null,
  );
  const [feedState, setFeedState] = useState<FeedState | null>(null);
  const [feedStack, setFeedStack] = useState<FeedState[]>([]);
  const [feed, setFeed] = useState<OpdsFeed | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTemplate, setSearchTemplate] =
    useState<OpdsSearchTemplate | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<OpdsEntry | null>(null);
  const [downloadingEntryId, setDownloadingEntryId] = useState<string | null>(
    null,
  );
  const [downloadQueue, setDownloadQueue] = useState<DownloadQueueItem[]>([]);

  useEffect(() => subscribeDownloadQueue(setDownloadQueue), []);

  const refreshCatalogs = useCallback(async () => {
    const stored = await loadOpdsCatalogs();
    setCatalogs(stored);
  }, []);

  useEffect(() => {
    void refreshCatalogs();
  }, [refreshCatalogs]);

  const loadFeed = useCallback(async (state: FeedState, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingFeed(true);
      setFeedError(null);
    }

    try {
      const nextFeed = await fetchOpdsFeed(state.catalog, state.url);
      setFeed(prev => {
        if (append && prev) {
          return {
            ...nextFeed,
            entries: [...prev.entries, ...nextFeed.entries],
          };
        }
        return nextFeed;
      });

      if (!append && nextFeed.searchDescriptionUrl) {
        const template = await fetchOpenSearchTemplate(
          state.catalog,
          resolveOpdsUrl(state.url, nextFeed.searchDescriptionUrl),
        );
        setSearchTemplate(template);
      } else if (!append) {
        setSearchTemplate(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load catalog.';
      if (!append) {
        setFeedError(message);
        setFeed(null);
      } else {
        showThemedAlert('Could not load more', message);
      }
    } finally {
      setLoadingFeed(false);
      setLoadingMore(false);
    }
  }, []);

  const openCatalog = useCallback(
    async (catalog: OpdsCatalog) => {
      const state: FeedState = {
        catalog,
        url: catalog.url,
        title: catalog.title,
      };
      setFeedStack([state]);
      setFeedState(state);
      setSearchActive(false);
      setSearchQuery('');
      await loadFeed(state);
    },
    [loadFeed],
  );

  const openSuggested = useCallback(
    async (suggested: { title: string; url: string }) => {
      const nextCatalogs = await addOpdsCatalog({
        title: suggested.title,
        url: suggested.url,
      });
      setCatalogs(nextCatalogs);
      const catalog = nextCatalogs.find(item => item.url === suggested.url);
      if (catalog) {
        await openCatalog(catalog);
      }
    },
    [openCatalog],
  );

  const openAddCatalogModal = useCallback(() => {
    setEditingCatalog(null);
    setCatalogModalVisible(true);
  }, []);

  const openEditCatalogModal = useCallback((catalog: OpdsCatalog) => {
    setEditingCatalog(catalog);
    setCatalogModalVisible(true);
  }, []);

  const closeCatalogModal = useCallback(() => {
    setCatalogModalVisible(false);
    setEditingCatalog(null);
  }, []);

  const applyUpdatedCatalogToFeed = useCallback(
    async (updated: OpdsCatalog) => {
      if (!feedState || feedState.catalog.id !== updated.id) {
        return;
      }

      const rootState: FeedState = {
        catalog: updated,
        url: updated.url,
        title: updated.title,
      };
      setFeedStack([rootState]);
      setFeedState(rootState);
      setSearchActive(false);
      setSearchQuery('');
      await loadFeed(rootState);
    },
    [feedState, loadFeed],
  );

  const handleSaveCatalog = useCallback(
    async (values: CatalogFormValues) => {
      try {
        if (editingCatalog) {
          const next = await updateOpdsCatalog(editingCatalog.id, values);
          setCatalogs(next);
          const updated = next.find(item => item.id === editingCatalog.id);
          if (updated) {
            const probe = await probeOpdsCatalog(updated);
            if (!probe.ok) {
              showThemedAlert(
                'Catalog saved',
                probe.error ?? 'Could not verify the catalog URL.',
              );
            }
            await applyUpdatedCatalogToFeed(updated);
          }
          return;
        }

        const draft = {
          url: values.url.trim(),
          title: values.title.trim(),
          opdsVersion: values.opdsVersion,
          username: values.username,
          password: values.password,
        };
        const probe = await probeOpdsCatalog({
          id: 'probe',
          title: draft.title,
          url: draft.url,
          opdsVersion: draft.opdsVersion,
          username: draft.username,
          password: values.password,
        });
        if (!probe.ok) {
          showThemedAlert(
            'Catalog unreachable',
            probe.error ?? 'Could not reach this OPDS URL.',
          );
          return;
        }

        const next = await addOpdsCatalog(values);
        setCatalogs(next);
        const catalog = next.find(item => item.url === values.url.trim());
        if (catalog) {
          await openCatalog(catalog);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not save catalog.';
        showThemedAlert(
          editingCatalog ? 'Update failed' : 'Add catalog failed',
          message,
        );
      }
    },
    [applyUpdatedCatalogToFeed, editingCatalog, openCatalog],
  );

  const handleRemoveCatalog = useCallback(
    (catalog: OpdsCatalog) => {
      showThemedDialog({
        title: 'Remove catalog?',
        message: `Remove "${catalog.title}" from Discover?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void removeOpdsCatalog(catalog.id).then(next => {
                setCatalogs(next);
                if (feedState?.catalog.id === catalog.id) {
                  setFeedStack([]);
                  setFeedState(null);
                  setFeed(null);
                  setFeedError(null);
                  setSearchTemplate(null);
                }
              });
            },
          },
        ],
      });
    },
    [feedState?.catalog.id],
  );

  const openNavigation = useCallback(
    async (href: string, title?: string) => {
      if (!feedState) {
        return;
      }
      const nextState: FeedState = {
        ...feedState,
        url: resolveOpdsUrl(feedState.url, href),
        title: title ?? feedState.title,
      };
      setFeedStack(prev => [...prev, nextState]);
      setFeedState(nextState);
      setSearchActive(false);
      setSearchQuery('');
      await loadFeed(nextState);
    },
    [feedState, loadFeed],
  );

  const handleBack = useCallback(() => {
    if (feedStack.length > 1) {
      const nextStack = feedStack.slice(0, -1);
      const previous = nextStack[nextStack.length - 1];
      setFeedStack(nextStack);
      setFeedState(previous);
      setSearchActive(false);
      setSearchQuery('');
      if (previous) {
        void loadFeed(previous);
      }
      return;
    }
    setFeedStack([]);
    setFeedState(null);
    setFeed(null);
    setFeedError(null);
    setSearchTemplate(null);
    setSearchActive(false);
    setSearchQuery('');
  }, [feedStack, loadFeed]);

  const handleSearch = useCallback(async () => {
    if (!feedState || !searchTemplate) {
      return;
    }
    const query = searchQuery.trim();
    if (!query) {
      return;
    }
    const searchUrl = buildSearchUrl(searchTemplate.template, query);
    const nextState: FeedState = {
      ...feedState,
      url: resolveOpdsUrl(feedState.catalog.url, searchUrl),
      title: `Search: ${query}`,
    };
    setFeedStack(prev => [...prev, nextState]);
    setFeedState(nextState);
    await loadFeed(nextState);
  }, [feedState, loadFeed, searchQuery, searchTemplate]);

  const ensureLibraryFolder = useCallback(async (): Promise<string | null> => {
    if (folderUri) {
      return folderUri;
    }

    return new Promise(resolve => {
      showThemedDialog({
        title: 'Choose your library folder',
        message:
          'Downloads are saved to the books folder you picked during setup. Choose that folder to continue.',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          {
            text: 'Choose folder',
            onPress: () => {
              void (async () => {
                await selectLibraryFolder();
                resolve(await loadLibraryFolderUri());
              })();
            },
          },
        ],
      });
    });
  }, [folderUri, selectLibraryFolder]);

  const handleDownloadEntry = useCallback(
    async (entry: OpdsEntry) => {
      if (!feedState) {
        return;
      }

      const acquisitionUrl = pickAcquisitionUrl(entry);
      if (!acquisitionUrl) {
        const hasDrm = entry.links.some(isDrmAcquisitionLink);
        showThemedAlert(
          'Cannot download',
          hasDrm
            ? 'This book appears to use DRM. FReeder only supports DRM-free EPUB files.'
            : 'No EPUB acquisition link was found for this entry.',
        );
        return;
      }

      const libraryFolder = folderUri ?? (await ensureLibraryFolder());
      if (!libraryFolder) {
        return;
      }

      const queueId = enqueueDownload(entry.title);
      updateDownloadItem(queueId, { status: 'downloading', progress: 0.1 });
      setDownloadingEntryId(entry.id);
      try {
        const downloaded = await downloadOpdsEntry(
          feedState.catalog,
          entry,
          acquisitionUrl,
          feedState.url,
          libraryFolder,
        );
        updateDownloadItem(queueId, { status: 'downloading', progress: 0.85 });
        await importOpdsBook(downloaded);
        updateDownloadItem(queueId, { status: 'done', progress: 1 });
        setSelectedEntry(null);
        showThemedDialog({
          title: 'Added to library',
          message: `"${downloaded.title}" was saved to your books folder.`,
          buttons: [
            { text: 'Stay here', style: 'cancel' },
            {
              text: 'Open library',
              onPress: () => navigation.navigate('LibraryTab'),
            },
          ],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Download failed.';
        updateDownloadItem(queueId, {
          status: 'error',
          error: message,
          progress: 0,
        });
        showThemedAlert('Download failed', message);
      } finally {
        setDownloadingEntryId(null);
      }
    },
    [ensureLibraryFolder, feedState, folderUri, importOpdsBook, navigation],
  );

  if (feedState) {
    const navigationLinks = feed ? getNavigationLinks(feed) : [];
    const publications = feed ? getPublicationEntries(feed) : [];

    return (
      <TabScreenLayout>
        <View style={styles.feedRoot}>
          <View style={styles.feedHeader}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleBack}
            >
              <Icon name="arrow-back" size={22} color={colors.onSurface} />
            </Pressable>
            <Text
              numberOfLines={1}
              style={[
                typography.titleMd,
                styles.feedTitle,
                { color: colors.onSurface },
              ]}
            >
              {feed?.title ?? feedState.title}
            </Text>
            {searchTemplate ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSearchActive(value => !value)}
              >
                <Icon name="search" size={22} color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityLabel="Edit catalog"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => openEditCatalogModal(feedState.catalog)}
            >
              <Icon name="edit" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
            {!searchTemplate ? <View style={styles.headerSpacer} /> : null}
          </View>

          {downloadQueue.length > 0 ? (
            <DownloadQueueBar
              items={downloadQueue}
              colors={colors}
              typography={typography}
            />
          ) : null}

          {searchActive && searchTemplate ? (
            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  void handleSearch();
                }}
                placeholder="Search catalog"
                placeholderTextColor={colors.onSurfaceVariant}
                returnKeyType="search"
                style={[
                  typography.body,
                  styles.searchInput,
                  { color: colors.onSurface },
                ]}
                value={searchQuery}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void handleSearch();
                }}
                style={[
                  styles.searchButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon name="arrow-forward" size={18} color={colors.onPrimary} />
              </Pressable>
            </View>
          ) : null}

          {loadingFeed ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={[typography.body, { color: colors.onSurfaceVariant }]}
              >
                Loading catalog…
              </Text>
            </View>
          ) : feedError ? (
            <View style={styles.centered}>
              <Text
                style={[
                  typography.body,
                  { color: colors.onSurfaceVariant, textAlign: 'center' },
                ]}
              >
                {feedError}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.feedContent}>
              {navigationLinks.length > 0 ? (
                <View style={styles.section}>
                  <Text
                    style={[
                      typography.caption,
                      styles.sectionLabel,
                      { color: colors.outline },
                    ]}
                  >
                    BROWSE
                  </Text>
                  {navigationLinks.map((link, index) => (
                    <Pressable
                      key={`${link.href}-${index}`}
                      accessibilityRole="button"
                      onPress={() => {
                        void openNavigation(link.href, link.title);
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          backgroundColor: pressed
                            ? colors.surfaceContainerHigh
                            : colors.surfaceContainerLow,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <Icon
                        name="folder-open"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        numberOfLines={2}
                        style={[
                          typography.body,
                          styles.rowTitle,
                          { color: colors.onSurface },
                        ]}
                      >
                        {link.title}
                      </Text>
                      <Icon
                        name="chevron-right"
                        size={20}
                        color={colors.onSurfaceVariant}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <Text
                  style={[
                    typography.caption,
                    styles.sectionLabel,
                    { color: colors.outline },
                  ]}
                >
                  BOOKS
                </Text>
                {publications.length === 0 ? (
                  <Text
                    style={[
                      typography.body,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    No downloadable EPUBs on this page.
                  </Text>
                ) : (
                  publications.map(entry => (
                    <EntryRow
                      key={entry.id}
                      baseUrl={feedState.url}
                      downloading={downloadingEntryId === entry.id}
                      entry={entry}
                      colors={colors}
                      typography={typography}
                      onDownload={() => {
                        void handleDownloadEntry(entry);
                      }}
                      onPress={() => setSelectedEntry(entry)}
                    />
                  ))
                )}
              </View>

              {feed?.nextUrl ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={loadingMore}
                  onPress={() => {
                    if (!feedState || !feed.nextUrl) {
                      return;
                    }
                    const nextState = {
                      ...feedState,
                      url: resolveOpdsUrl(feedState.url, feed.nextUrl),
                    };
                    setFeedStack(prev => [...prev.slice(0, -1), nextState]);
                    setFeedState(nextState);
                    void loadFeed(nextState, true);
                  }}
                  style={[
                    styles.loadMore,
                    { borderColor: colors.outlineVariant },
                  ]}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text
                      style={[typography.button, { color: colors.primary }]}
                    >
                      Load more
                    </Text>
                  )}
                </Pressable>
              ) : null}
            </ScrollView>
          )}

          <EntryDetailModal
            baseUrl={feedState.url}
            colors={colors}
            downloading={
              selectedEntry != null && downloadingEntryId === selectedEntry.id
            }
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onDownload={() => {
              if (selectedEntry) {
                void handleDownloadEntry(selectedEntry);
              }
            }}
            typography={typography}
            visible={selectedEntry != null}
          />
          <AddCatalogModal
            catalog={editingCatalog}
            onClose={closeCatalogModal}
            onSubmit={values => {
              void handleSaveCatalog(values);
            }}
            visible={catalogModalVisible}
          />
        </View>
      </TabScreenLayout>
    );
  }

  return (
    <TabScreenLayout>
      <ScrollView
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={[typography.displayTitle, { color: colors.onSurface }]}>
            Discover
          </Text>
          <Text
            style={[
              typography.body,
              styles.lead,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Browse OPDS catalogs and download DRM-free EPUBs into your local
            library.
          </Text>
        </View>

        {downloadQueue.length > 0 ? (
          <DownloadQueueBar
            items={downloadQueue}
            colors={colors}
            typography={typography}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={openAddCatalogModal}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Icon name="add" size={20} color={colors.onPrimary} />
          <Text style={[typography.button, { color: colors.onPrimary }]}>
            Add catalog
          </Text>
        </Pressable>

        {catalogs.length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                typography.caption,
                styles.sectionLabel,
                { color: colors.outline },
              ]}
            >
              YOUR CATALOGS
            </Text>
            {catalogs.map(catalog => (
              <View
                key={catalog.id}
                style={[
                  styles.catalogRow,
                  { borderColor: colors.outlineVariant },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void openCatalog(catalog);
                  }}
                  style={({ pressed }) => [
                    styles.catalogBody,
                    pressed && { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <Icon
                    name="cloud-download"
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.catalogCopy}>
                    <Text
                      style={[typography.body, { color: colors.onSurface }]}
                    >
                      {catalog.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        typography.caption,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {catalog.url}
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="Edit catalog"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => openEditCatalogModal(catalog)}
                  style={styles.catalogAction}
                >
                  <Icon name="edit" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Remove catalog"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => handleRemoveCatalog(catalog)}
                  style={styles.catalogAction}
                >
                  <Icon
                    name="delete-outline"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text
            style={[
              typography.caption,
              styles.sectionLabel,
              { color: colors.outline },
            ]}
          >
            SUGGESTED
          </Text>
          {SUGGESTED_CATALOGS.map(item => (
            <Pressable
              key={item.url}
              accessibilityRole="button"
              onPress={() => {
                void openSuggested(item);
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed
                    ? colors.surfaceContainerHigh
                    : colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Icon name="auto-stories" size={20} color={colors.primary} />
              <Text
                style={[
                  typography.body,
                  styles.rowTitle,
                  { color: colors.onSurface },
                ]}
              >
                {item.title}
              </Text>
              <Icon
                name="chevron-right"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <AddCatalogModal
        catalog={editingCatalog}
        onClose={closeCatalogModal}
        onSubmit={values => {
          void handleSaveCatalog(values);
        }}
        visible={catalogModalVisible}
      />
    </TabScreenLayout>
  );
}

function EntryRow({
  entry,
  baseUrl,
  colors,
  typography,
  downloading,
  onPress,
  onDownload,
}: {
  entry: OpdsEntry;
  baseUrl: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  downloading: boolean;
  onPress: () => void;
  onDownload: () => void;
}) {
  const thumbPath = getThumbnailUrl(entry.links);
  const thumb = thumbPath ? resolveOpdsUrl(baseUrl, thumbPath) : undefined;
  const canDownload = pickAcquisitionUrl(entry) != null;

  return (
    <View
      style={[
        styles.entryRow,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.entryMain}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              { backgroundColor: colors.surfaceContainer },
            ]}
          >
            <Icon name="menu-book" size={22} color={colors.outline} />
          </View>
        )}
        <View style={styles.entryCopy}>
          <Text
            numberOfLines={2}
            style={[typography.body, { color: colors.onSurface }]}
          >
            {entry.title}
          </Text>
          {entry.author ? (
            <Text
              numberOfLines={1}
              style={[typography.caption, { color: colors.onSurfaceVariant }]}
            >
              {entry.author}
            </Text>
          ) : null}
          <Text
            style={[
              typography.caption,
              { color: canDownload ? colors.primary : colors.outline },
            ]}
          >
            {canDownload ? 'EPUB available' : 'No DRM-free EPUB'}
          </Text>
        </View>
      </Pressable>
      {canDownload ? (
        <Pressable
          accessibilityLabel={`Download ${entry.title}`}
          accessibilityRole="button"
          disabled={downloading}
          hitSlop={8}
          onPress={onDownload}
          style={({ pressed }) => [
            styles.downloadIconButton,
            {
              backgroundColor: pressed
                ? colors.primaryContainer
                : colors.surfaceContainerHigh,
              opacity: downloading ? 0.6 : 1,
            },
          ]}
        >
          {downloading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Icon name="download" size={22} color={colors.primary} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function EntryDetailModal({
  visible,
  entry,
  baseUrl,
  downloading,
  onClose,
  onDownload,
  colors,
  typography,
}: {
  visible: boolean;
  entry: OpdsEntry | null;
  baseUrl: string;
  downloading: boolean;
  onClose: () => void;
  onDownload: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}) {
  if (!entry) {
    return null;
  }

  const thumbPath = getThumbnailUrl(entry.links);
  const thumb = thumbPath ? resolveOpdsUrl(baseUrl, thumbPath) : undefined;
  const canDownload = pickAcquisitionUrl(entry) != null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>
              Book details
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>
                Close
              </Text>
            </Pressable>
          </View>

          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.detailCover} />
          ) : null}

          <Text style={[typography.headline, { color: colors.onSurface }]}>
            {entry.title}
          </Text>
          {entry.author ? (
            <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
              {entry.author}
            </Text>
          ) : null}
          {entry.summary ? (
            <Text
              style={[
                typography.body,
                styles.summary,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {entry.summary}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canDownload || downloading}
            onPress={onDownload}
            style={[
              styles.downloadButton,
              {
                backgroundColor: canDownload
                  ? colors.primary
                  : colors.surfaceContainerHigh,
                opacity: downloading ? 0.7 : 1,
              },
            ]}
          >
            {downloading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[typography.button, { color: colors.onPrimary }]}>
                {canDownload
                  ? 'Download to books folder'
                  : 'EPUB not available'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DownloadQueueBar({
  items,
  colors,
  typography,
}: {
  items: DownloadQueueItem[];
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}) {
  const active = items.filter(
    item => item.status === 'queued' || item.status === 'downloading',
  );
  const failed = items.filter(item => item.status === 'error');
  if (active.length === 0 && failed.length === 0) {
    return null;
  }

  const current = active[0] ?? failed[0];
  const progress = Math.round((current?.progress ?? 0) * 100);
  const statusLabel =
    current?.status === 'queued'
      ? 'Queued'
      : current?.status === 'downloading'
      ? `Downloading… ${progress}%`
      : current?.status === 'error'
      ? 'Download failed'
      : 'Done';

  return (
    <View
      style={[
        downloadQueueStyles.bar,
        {
          backgroundColor: colors.surfaceContainerHigh,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={downloadQueueStyles.row}>
        {current?.status === 'downloading' || current?.status === 'queued' ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Icon
            color={current?.status === 'error' ? colors.error : colors.primary}
            name={
              current?.status === 'error' ? 'error-outline' : 'check-circle'
            }
            size={20}
          />
        )}
        <View style={downloadQueueStyles.copy}>
          <Text
            numberOfLines={1}
            style={[
              typography.titleMd,
              { color: colors.onSurface, fontSize: 15 },
            ]}
          >
            {current?.title ?? 'Download'}
          </Text>
          <Text
            style={[typography.caption, { color: colors.onSurfaceVariant }]}
          >
            {statusLabel}
            {active.length > 1 ? ` · +${active.length - 1} more` : ''}
          </Text>
        </View>
      </View>
      {current?.status === 'downloading' ? (
        <View
          style={[
            downloadQueueStyles.track,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <View
            style={[
              downloadQueueStyles.fill,
              {
                backgroundColor: colors.primary,
                width: `${Math.max(8, progress)}%`,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const downloadQueueStyles = StyleSheet.create({
  bar: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
    padding: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  track: {
    borderRadius: 4,
    height: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
    height: 4,
  },
});

const styles = StyleSheet.create({
  homeContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  intro: {
    gap: 12,
    marginBottom: 24,
  },
  lead: {
    lineHeight: 24,
    opacity: 0.9,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
    paddingVertical: 14,
  },
  section: {
    gap: 8,
    marginBottom: 28,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  catalogRow: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  catalogBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  catalogCopy: {
    flex: 1,
    gap: 2,
  },
  catalogAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowTitle: {
    flex: 1,
  },
  feedRoot: {
    flex: 1,
  },
  feedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  feedTitle: {
    flex: 1,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 22,
  },
  searchRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
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
  feedContent: {
    gap: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 32,
  },
  entryRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  entryMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  downloadIconButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  thumb: {
    borderRadius: 8,
    height: 64,
    width: 44,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 44,
  },
  entryCopy: {
    flex: 1,
    gap: 2,
  },
  loadMore: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    paddingVertical: 14,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCover: {
    alignSelf: 'center',
    borderRadius: 8,
    height: 180,
    width: 120,
  },
  summary: {
    lineHeight: 22,
  },
  downloadButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 16,
  },
});
