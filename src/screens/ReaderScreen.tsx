import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ReadiumView } from 'react-native-readium';

import { ReaderBookmarksModal } from '../components/reader/ReaderBookmarksModal';
import { ReaderComfortOverlay } from '../components/reader/ReaderComfortOverlay';
import { ReaderHeader } from '../components/reader/ReaderHeader';
import {
  ReaderHighlightColorModal,
  ReaderHighlightEditModal,
} from '../components/reader/ReaderHighlightDialogs';
import { ReaderHighlightsModal } from '../components/reader/ReaderHighlightsModal';
import { ReaderHighlightStyleModal } from '../components/reader/ReaderHighlightStyleModal';
import { ReaderMenuButton } from '../components/reader/ReaderMenuButton';
import { ReaderMetadataModal } from '../components/reader/ReaderMetadataModal';
import { ReaderProgressModal } from '../components/reader/ReaderProgressModal';
import { ReaderSearchModal } from '../components/reader/ReaderSearchModal';
import { ReaderSettingsModal } from '../components/reader/ReaderSettingsModal';
import { ReaderTapGestureWrapper } from '../components/reader/ReaderTapGestureWrapper';
import { ReaderTocModal } from '../components/reader/ReaderTocModal';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useReaderChrome } from '../hooks/useReaderChrome';
import {
  SELECTION_ACTIONS,
  useReaderHighlights,
} from '../hooks/useReaderHighlights';
import { useReaderSearch } from '../hooks/useReaderSearch';
import {
  addBookmark,
  loadBookmarks,
  removeBookmark,
  type BookBookmark,
} from '../services/bookBookmarks';
import {
  classifyBookOpenError,
  verifyBookAccessible,
} from '../services/bookDeletion';
import { resolveReadableBookUri } from '../services/bookFile';
import {
  clearBookReaderPrefs,
  loadBookReaderPrefs,
  saveBookReaderPrefs,
} from '../services/bookReaderPrefs';
import {
  DEFAULT_READER_CHROME_PREFS,
  loadReaderChromePrefs,
  saveReaderChromePrefs,
  type TapZoneAction,
  type ReaderChromePrefs,
} from '../services/readerChromePrefs';
import {
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
  readerPreferencesToReadium,
  saveReaderPreferences,
  type ReaderPreferences,
} from '../services/readerPreferences';
import {
  getReadingState,
  progressFromLocator,
  saveReadingState,
  updateReadingFlags,
} from '../services/readingProgress';
import {
  recordBookFinished,
  recordReadingSession,
} from '../services/readingStatistics';
import { useTheme } from '../theme';
import { getBookFileName } from '../types/book';
import {
  flattenTocLinks,
  chapterTitleForLocator,
  locatorAtProgress,
  locatorForLink,
} from '../utils/readiumNavigation';

import type { RootStackParamList } from '../navigation/types';
import type { TocLink } from '../utils/readiumNavigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  Link,
  Locator,
  PublicationMetadata,
  PublicationReadyEvent,
  ReadiumFile,
  ReadiumViewRef,
} from 'react-native-readium';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

export function ReaderScreen({ navigation, route }: Props) {
  const { book } = route.params;
  const { colors, typography } = useTheme();
  const readerRef = useRef<ReadiumViewRef>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastReadingTickRef = useRef<number | null>(null);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [initialLocator, setInitialLocator] = useState<Locator | undefined>();
  const [readerReady, setReaderReady] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(
    null,
  );
  const [author, setAuthor] = useState(book.author);
  const [favorite, setFavorite] = useState(false);
  const [preferences, setPreferences] = useState<ReaderPreferences>(
    DEFAULT_READER_PREFERENCES,
  );
  const [chromePrefs, setChromePrefs] = useState<ReaderChromePrefs>(
    DEFAULT_READER_CHROME_PREFS,
  );
  const [bookOverrideEnabled, setBookOverrideEnabled] = useState(false);
  const [tocTree, setTocTree] = useState<TocLink[]>([]);
  const [tocLinks, setTocLinks] = useState<Link[]>([]);
  const [positions, setPositions] = useState<Locator[]>([]);
  const [publicationMetadata, setPublicationMetadata] =
    useState<PublicationMetadata | null>(null);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [tocVisible, setTocVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [bookmarksVisible, setBookmarksVisible] = useState(false);
  const [highlightsVisible, setHighlightsVisible] = useState(false);
  const [metadataVisible, setMetadataVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [displayTitle, setDisplayTitle] = useState(book.title);
  const [currentLocator, setCurrentLocator] = useState<Locator | undefined>();

  const {
    results: searchResults,
    isSearching,
    isLoadingMore: isLoadingMoreSearch,
    isSupported: isSearchSupported,
    hasMore: hasMoreSearchResults,
    search,
    loadMore: loadMoreSearchResults,
    clear: clearSearch,
  } = useReaderSearch(readerRef);

  const {
    decorations,
    highlights,
    styleModalVisible,
    colorPickerVisible,
    pendingHighlight,
    editDialogVisible,
    selectedHighlight,
    handleSelectionAction,
    handleSelectHighlightStyle,
    handleCreateHighlight,
    handleCancelHighlight,
    handleCancelStyleModal,
    handleDecorationActivated,
    handleEditHighlight,
    handleUpdateHighlight,
    handleDeleteHighlight,
    handleCancelEdit,
  } = useReaderHighlights(book.id);

  const modalsOpen =
    tocVisible ||
    searchVisible ||
    bookmarksVisible ||
    highlightsVisible ||
    metadataVisible ||
    settingsVisible ||
    progressVisible ||
    styleModalVisible ||
    colorPickerVisible ||
    editDialogVisible;

  const { chromeVisible, handleCenterTap, notifyChromeInteraction } =
    useReaderChrome(modalsOpen, readerReady);

  const runTapAction = useCallback(
    (action: TapZoneAction) => {
      switch (action) {
        case 'prev':
          readerRef.current?.goBackward();
          break;
        case 'next':
          readerRef.current?.goForward();
          break;
        case 'menu':
          handleCenterTap();
          break;
        case 'none':
          break;
      }
    },
    [handleCenterTap],
  );

  const tapGesturesEnabled = readerReady && !modalsOpen;

  useAutoScroll(
    readerRef,
    chromePrefs.autoScrollWpm,
    preferences.readingMode,
    readerReady && !modalsOpen,
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const [
        state,
        globalPrefs,
        bookPrefs,
        storedChromePrefs,
        storedBookmarks,
      ] = await Promise.all([
        getReadingState(book.id),
        loadReaderPreferences(),
        loadBookReaderPrefs(book.id),
        loadReaderChromePrefs(),
        loadBookmarks(book.id),
      ]);

      if (!mounted) {
        return;
      }

      const hasBookOverride =
        bookPrefs !== null && Object.keys(bookPrefs).length > 0;
      setBookOverrideEnabled(hasBookOverride);
      setPreferences(
        hasBookOverride ? { ...globalPrefs, ...bookPrefs } : globalPrefs,
      );
      setChromePrefs(storedChromePrefs);
      setFavorite(Boolean(state?.favorite));
      setInitialLocator(state?.locator);
      setCurrentLocator(state?.locator);
      setCurrentProgress(state?.progress ?? 0);
      setBookmarks(storedBookmarks);

      try {
        const localUri = await resolveReadableBookUri(
          book.fileUrl,
          getBookFileName(book),
        );
        if (mounted) {
          setFileUrl(localUri);
        }
      } catch (err) {
        const accessible = await verifyBookAccessible(book);
        if (mounted) {
          if (!accessible) {
            setError({
              code: book.missing ? 'missing' : 'permission',
              message: book.missing
                ? 'This book file is missing. Locate it again from the library.'
                : 'FReeder cannot access this book file. Check folder permissions or locate the file again.',
            });
            return;
          }
          setError(classifyBookOpenError(err));
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [book]);

  useEffect(() => {
    return () => {
      readerRef.current = null;
    };
  }, []);

  const readiumPreferences = useMemo(
    () => readerPreferencesToReadium(preferences),
    [preferences],
  );

  const chromeColors = useMemo(() => {
    const isDark = preferences.theme === 'dark';
    return {
      surface: isDark ? 'rgba(26, 28, 29, 0.94)' : 'rgba(255, 255, 255, 0.94)',
      text: readiumPreferences.textColor ?? (isDark ? '#f0f0f2' : '#1a1c1d'),
      icon: readiumPreferences.textColor ?? (isDark ? '#f0f0f2' : '#1a1c1d'),
      active: '#4352a5',
    };
  }, [preferences.theme, readiumPreferences.textColor]);

  const file = useMemo<ReadiumFile | undefined>(
    () =>
      fileUrl
        ? {
            url: fileUrl,
            initialLocation: currentLocator ?? initialLocator,
          }
        : undefined,
    [fileUrl, initialLocator, currentLocator],
  );

  const readiumViewKey = fileUrl
    ? `${fileUrl}:${preferences.readingMode}`
    : 'loading';

  useEffect(() => {
    const now = Date.now();
    sessionStartedAtRef.current = now;
    lastReadingTickRef.current = now;
    return () => {
      const lastTick = lastReadingTickRef.current;
      if (lastTick) {
        const seconds = Math.round((Date.now() - lastTick) / 1000);
        void recordReadingSession(book.id, seconds);
      }
    };
  }, [book.id]);

  const recordReadingTick = useCallback(() => {
    const now = Date.now();
    const last = lastReadingTickRef.current ?? now;
    const seconds = Math.min(120, Math.max(0, Math.round((now - last) / 1000)));
    lastReadingTickRef.current = now;
    if (seconds >= 5) {
      void recordReadingSession(book.id, seconds);
    }
  }, [book.id]);

  const persistLocator = useCallback(
    (locator: Locator) => {
      const progress = progressFromLocator(locator);
      setCurrentLocator(locator);
      setCurrentProgress(progress);
      const wasFinished = currentProgress >= 0.98;
      void saveReadingState({
        bookId: book.id,
        progress,
        locator,
        lastOpenedAt: Date.now(),
        title: book.title,
        author,
        favorite,
        finished: progress >= 0.98 ? true : undefined,
      });
      if (progress >= 0.98) {
        void updateReadingFlags(book.id, { finished: true });
        if (!wasFinished) {
          void recordBookFinished();
        }
      }
    },
    [author, book.id, book.title, currentProgress, favorite],
  );

  const handlePublicationReady = useCallback(
    async (event: PublicationReadyEvent) => {
      const title = event.metadata.title || book.title;
      const metadataAuthor = event.metadata.author?.[0]?.name;
      if (metadataAuthor) {
        setAuthor(metadataAuthor);
      }
      setDisplayTitle(title);
      setPublicationMetadata(event.metadata);
      const tree = (event.tableOfContents ?? []) as TocLink[];
      const flatToc = flattenTocLinks(tree);
      const loadedPositions = event.positions ?? [];
      setTocTree(tree);
      setTocLinks(flatToc);
      setPositions(loadedPositions);
      setReaderReady(true);

      const existing = await getReadingState(book.id);
      if (existing?.locator) {
        setChapterTitle(
          chapterTitleForLocator(existing.locator, flatToc, loadedPositions),
        );
      }
      if (existing?.locator && readerRef.current) {
        readerRef.current.goTo(existing.locator);
      }

      await saveReadingState({
        bookId: book.id,
        progress: existing?.progress ?? 0,
        locator: existing?.locator,
        lastOpenedAt: Date.now(),
        title,
        author: metadataAuthor ?? existing?.author ?? author,
        favorite: existing?.favorite ?? favorite,
      });
    },
    [author, book.id, book.title, favorite],
  );

  const handleLocationChange = useCallback(
    (locator: Locator) => {
      recordReadingTick();
      setChapterTitle(chapterTitleForLocator(locator, tocLinks, positions));
      persistLocator(locator);
    },
    [persistLocator, recordReadingTick, tocLinks, positions],
  );

  const handlePreferencesChange = useCallback(
    (next: ReaderPreferences) => {
      if (next.readingMode !== preferences.readingMode) {
        setReaderReady(false);
      }
      setPreferences(next);
      if (bookOverrideEnabled) {
        void saveBookReaderPrefs(book.id, next);
      } else {
        void saveReaderPreferences(next);
      }
    },
    [book.id, bookOverrideEnabled, preferences.readingMode],
  );

  const handleChromePrefsChange = useCallback((next: ReaderChromePrefs) => {
    setChromePrefs(next);
    void saveReaderChromePrefs(next);
  }, []);

  const handleBookOverrideChange = useCallback(
    async (enabled: boolean) => {
      setBookOverrideEnabled(enabled);
      if (enabled) {
        await saveBookReaderPrefs(book.id, preferences);
        return;
      }

      await clearBookReaderPrefs(book.id);
      const globalPrefs = await loadReaderPreferences();
      setPreferences(globalPrefs);
    },
    [book.id, preferences],
  );

  const navigateToLocator = useCallback((locator: Locator) => {
    readerRef.current?.goTo(locator);
  }, []);

  const handleSelectTocLink = useCallback(
    (link: Link) => {
      const locator = locatorForLink(link, positions);
      if (locator) {
        navigateToLocator(locator);
      }
    },
    [navigateToLocator, positions],
  );

  const handleSelectProgress = useCallback(
    (progress: number) => {
      const locator = locatorAtProgress(positions, progress);
      if (locator) {
        navigateToLocator(locator);
      }
    },
    [navigateToLocator, positions],
  );

  const handleToggleFavorite = useCallback(() => {
    const next = !favorite;
    setFavorite(next);
    void updateReadingFlags(book.id, { favorite: next });
  }, [book.id, favorite]);

  const handleAddBookmark = useCallback(async () => {
    if (!currentLocator) {
      return;
    }

    const progress = currentProgress;
    const label =
      chapterTitle?.trim() || `Bookmark at ${Math.round(progress * 100)}%`;

    const bookmark: BookBookmark = {
      id: `bookmark-${Date.now()}`,
      locator: currentLocator,
      label,
      createdAt: Date.now(),
      progress,
    };

    const next = await addBookmark(book.id, bookmark);
    setBookmarks(next);
  }, [book.id, chapterTitle, currentLocator, currentProgress]);

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string) => {
      const next = await removeBookmark(book.id, bookmarkId);
      setBookmarks(next);
    },
    [book.id],
  );

  const handleSearch = useCallback(
    (query: string) => {
      void search(query, { caseSensitive: false });
    },
    [search],
  );

  const handleCloseSearch = useCallback(() => {
    setSearchVisible(false);
    clearSearch();
  }, [clearSearch]);

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text
          style={[
            typography.headline,
            { color: colors.onSurface, textAlign: 'center' },
          ]}
        >
          Unable to open book
        </Text>
        <Text
          style={[
            typography.body,
            styles.errorBody,
            { color: colors.onSurfaceVariant },
          ]}
        >
          {error.message}
        </Text>
        <Text
          style={[
            typography.caption,
            styles.errorHint,
            { color: colors.onSurfaceVariant },
          ]}
        >
          FReeder supports DRM-free EPUB 2 and EPUB 3 files only.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[styles.errorButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[typography.button, { color: colors.onPrimary }]}>
            Back to library
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!file) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            typography.body,
            styles.loadingText,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Opening EPUB…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.reader,
        { backgroundColor: readiumPreferences.backgroundColor },
      ]}
    >
      <ReaderTapGestureWrapper
        enabled={tapGesturesEnabled}
        tapZones={chromePrefs.tapZones}
        onZoneAction={runTapAction}
      >
        <ReadiumView
          key={readiumViewKey}
          ref={readerRef}
          decorations={decorations}
          file={file}
          preferences={readiumPreferences}
          selectionActions={SELECTION_ACTIONS}
          style={styles.reader}
          onDecorationActivated={handleDecorationActivated}
          onLocationChange={handleLocationChange}
          onPublicationReady={handlePublicationReady}
          onSelectionAction={handleSelectionAction}
        />
      </ReaderTapGestureWrapper>
      {readerReady ? (
        <>
          <ReaderComfortOverlay chromePrefs={chromePrefs} />
          <ReaderMenuButton
            chromeVisible={chromeVisible}
            iconColor={chromeColors.icon}
            onPress={handleCenterTap}
            surfaceColor={chromeColors.surface}
            visible={!modalsOpen}
          />
          <ReaderHeader
            activeIconColor={chromeColors.active}
            bookTitle={displayTitle}
            chapterTitle={chapterTitle}
            favorite={favorite}
            onBack={() => navigation.goBack()}
            onInteraction={notifyChromeInteraction}
            onOpenInfo={() => setMetadataVisible(true)}
            onToggleFavorite={handleToggleFavorite}
            surfaceColor={chromeColors.surface}
            textColor={chromeColors.text}
            visible={chromeVisible}
          />
          <ReaderToolbar
            iconColor={chromeColors.icon}
            onInteraction={notifyChromeInteraction}
            onOpenBookmarks={() => setBookmarksVisible(true)}
            onOpenHighlights={() => setHighlightsVisible(true)}
            onOpenProgress={() => setProgressVisible(true)}
            onOpenSearch={() => setSearchVisible(true)}
            onOpenSettings={() => setSettingsVisible(true)}
            onOpenToc={() => setTocVisible(true)}
            surfaceColor={chromeColors.surface}
            visible={chromeVisible}
          />
        </>
      ) : null}
      <ReaderTocModal
        links={tocTree}
        onClose={() => setTocVisible(false)}
        onSelect={handleSelectTocLink}
        visible={tocVisible}
      />
      <ReaderSearchModal
        hasMore={hasMoreSearchResults}
        isLoadingMore={isLoadingMoreSearch}
        isSearching={isSearching}
        isSupported={isSearchSupported}
        onClear={clearSearch}
        onClose={handleCloseSearch}
        onLoadMore={loadMoreSearchResults}
        onSearch={handleSearch}
        onSelectResult={navigateToLocator}
        results={searchResults}
        visible={searchVisible}
      />
      <ReaderBookmarksModal
        bookmarks={bookmarks}
        currentProgress={currentProgress}
        onAddBookmark={handleAddBookmark}
        onClose={() => setBookmarksVisible(false)}
        onDelete={handleDeleteBookmark}
        onSelect={navigateToLocator}
        visible={bookmarksVisible}
      />
      <ReaderHighlightsModal
        highlights={highlights}
        onClose={() => setHighlightsVisible(false)}
        onEdit={handleEditHighlight}
        onSelect={highlight => navigateToLocator(highlight.locator)}
        visible={highlightsVisible}
      />
      <ReaderMetadataModal
        metadata={publicationMetadata}
        onClose={() => setMetadataVisible(false)}
        visible={metadataVisible}
      />
      <ReaderSettingsModal
        bookOverrideEnabled={bookOverrideEnabled}
        chromePrefs={chromePrefs}
        onBookOverrideChange={handleBookOverrideChange}
        onChange={handlePreferencesChange}
        onChromePrefsChange={handleChromePrefsChange}
        onClose={() => setSettingsVisible(false)}
        preferences={preferences}
        visible={settingsVisible}
      />
      <ReaderProgressModal
        onClose={() => setProgressVisible(false)}
        onSelectPosition={navigateToLocator}
        onSelectProgress={handleSelectProgress}
        positions={positions}
        progress={currentProgress}
        visible={progressVisible}
      />
      <ReaderHighlightStyleModal
        onClose={handleCancelStyleModal}
        onSelect={handleSelectHighlightStyle}
        selectedText={pendingHighlight?.selectedText}
        visible={styleModalVisible}
      />
      <ReaderHighlightColorModal
        onClose={handleCancelHighlight}
        onSave={handleCreateHighlight}
        selectedText={pendingHighlight?.selectedText}
        visible={colorPickerVisible}
      />
      <ReaderHighlightEditModal
        highlight={selectedHighlight}
        onClose={handleCancelEdit}
        onDelete={handleDeleteHighlight}
        onSave={handleUpdateHighlight}
        visible={editDialogVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reader: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  errorBody: {
    marginTop: 12,
    textAlign: 'center',
  },
  errorHint: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorButton: {
    borderRadius: 999,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
