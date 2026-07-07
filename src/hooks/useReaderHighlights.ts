import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';

import { loadHighlights, saveHighlights } from '../services/bookAnnotations';

import type { HighlightStyleType } from '../components/reader/ReaderHighlightStyleModal';
import type {
  Decoration,
  DecorationActivatedEvent,
  DecorationGroup,
  DecorationStyle,
  SelectionAction,
  SelectionActionEvent,
} from 'react-native-readium';

export const HIGHLIGHT_COLORS = [
  '#FFF59D',
  '#A5D6A7',
  '#90CAF9',
  '#F48FB1',
] as const;

export const SELECTION_ACTIONS: SelectionAction[] = [
  { id: 'copy', label: 'Copy' },
  { id: 'share', label: 'Share' },
  { id: 'dictionary', label: 'Dictionary' },
  { id: 'highlight', label: 'Highlight' },
];

function decorationStyleFromType(
  styleType: HighlightStyleType,
  tint: string,
): DecorationStyle {
  // Readium native layer only supports highlight + underline today.
  if (styleType === 'squiggly' || styleType === 'underline') {
    return { type: 'underline', tint };
  }
  return { type: 'highlight', tint };
}

async function copySelectedText(text: string): Promise<void> {
  await Share.share({ message: text });
}

async function shareSelectedText(text: string): Promise<void> {
  await Share.share({ message: text });
}

async function openDictionary(text: string): Promise<void> {
  const word = text.trim().split(/\s+/)[0];
  if (!word) {
    return;
  }

  const encoded = encodeURIComponent(word);
  const url =
    Platform.OS === 'ios'
      ? `dict://${encoded}`
      : `https://en.wiktionary.org/wiki/${encoded}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  await Linking.openURL(`https://en.wiktionary.org/wiki/${encoded}`);
}

function updateHighlightGroup(
  groups: DecorationGroup[],
  updater: (highlights: Decoration[]) => Decoration[],
): DecorationGroup[] {
  const existing = groups.find(group => group.name === 'highlights');
  const current = existing?.decorations ?? [];
  const next = updater(current);

  if (existing) {
    return groups.map(group =>
      group.name === 'highlights' ? { ...group, decorations: next } : group,
    );
  }

  return [...groups, { name: 'highlights', decorations: next }];
}

type PendingHighlight = {
  locator: SelectionActionEvent['locator'];
  selectedText: string;
  styleType: HighlightStyleType;
};

export function useReaderHighlights(bookId: string) {
  const [decorations, setDecorations] = useState<DecorationGroup[]>([
    { name: 'highlights', decorations: [] },
  ]);
  const [styleModalVisible, setStyleModalVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [pendingHighlight, setPendingHighlight] =
    useState<PendingHighlight | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Decoration | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    void loadHighlights(bookId).then(stored => {
      if (!mounted) {
        return;
      }
      setDecorations([{ name: 'highlights', decorations: stored }]);
    });
    return () => {
      mounted = false;
    };
  }, [bookId]);

  const highlights = useMemo(
    () =>
      decorations.find(group => group.name === 'highlights')?.decorations ?? [],
    [decorations],
  );

  const persistDecorations = useCallback(
    (next: DecorationGroup[]) => {
      setDecorations(next);
      const nextHighlights =
        next.find(group => group.name === 'highlights')?.decorations ?? [];
      void saveHighlights(bookId, nextHighlights);
    },
    [bookId],
  );

  const handleSelectionAction = useCallback((event: SelectionActionEvent) => {
    const { selectedText } = event;

    switch (event.actionId) {
      case 'copy':
        void copySelectedText(selectedText);
        break;
      case 'share':
        void shareSelectedText(selectedText);
        break;
      case 'dictionary':
        void openDictionary(selectedText);
        break;
      case 'highlight':
        setPendingHighlight({
          locator: event.locator,
          selectedText,
          styleType: 'highlight',
        });
        setStyleModalVisible(true);
        break;
    }
  }, []);

  const handleSelectHighlightStyle = useCallback(
    (styleType: HighlightStyleType) => {
      setPendingHighlight(prev => (prev ? { ...prev, styleType } : prev));
      setStyleModalVisible(false);
      setColorPickerVisible(true);
    },
    [],
  );

  const handleCreateHighlight = useCallback(
    (color: string, note: string) => {
      if (!pendingHighlight) {
        return;
      }

      const newHighlight: Decoration = {
        id: `highlight-${Date.now()}`,
        locator: pendingHighlight.locator,
        style: decorationStyleFromType(pendingHighlight.styleType, color),
        extras: {
          note,
          createdAt: new Date().toISOString(),
          selectedText: pendingHighlight.selectedText,
          styleType: pendingHighlight.styleType,
        },
      };

      setDecorations(prev => {
        const next = updateHighlightGroup(prev, current => [
          ...current,
          newHighlight,
        ]);
        const nextHighlights =
          next.find(group => group.name === 'highlights')?.decorations ?? [];
        void saveHighlights(bookId, nextHighlights);
        return next;
      });

      setColorPickerVisible(false);
      setPendingHighlight(null);
    },
    [bookId, pendingHighlight],
  );

  const handleCancelHighlight = useCallback(() => {
    setColorPickerVisible(false);
    setStyleModalVisible(false);
    setPendingHighlight(null);
  }, []);

  const handleCancelStyleModal = useCallback(() => {
    setStyleModalVisible(false);
    setPendingHighlight(null);
  }, []);

  const handleDecorationActivated = useCallback(
    (event: DecorationActivatedEvent) => {
      setSelectedHighlight(event.decoration);
      setEditDialogVisible(true);
    },
    [],
  );

  const handleEditHighlight = useCallback((highlight: Decoration) => {
    setSelectedHighlight(highlight);
    setEditDialogVisible(true);
  }, []);

  const handleUpdateHighlight = useCallback(
    (
      id: string,
      color: string,
      note: string,
      styleType: HighlightStyleType,
    ) => {
      const next = updateHighlightGroup(decorations, current =>
        current.map(item =>
          item.id === id
            ? {
                ...item,
                style: decorationStyleFromType(styleType, color),
                extras: { ...item.extras, note, styleType },
              }
            : item,
        ),
      );
      persistDecorations(next);
      setEditDialogVisible(false);
      setSelectedHighlight(null);
    },
    [decorations, persistDecorations],
  );

  const handleDeleteHighlight = useCallback(
    (id: string) => {
      const next = updateHighlightGroup(decorations, current =>
        current.filter(item => item.id !== id),
      );
      persistDecorations(next);
      setEditDialogVisible(false);
      setSelectedHighlight(null);
    },
    [decorations, persistDecorations],
  );

  const handleCancelEdit = useCallback(() => {
    setEditDialogVisible(false);
    setSelectedHighlight(null);
  }, []);

  return {
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
  };
}
