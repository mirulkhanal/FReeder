import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Decoration } from 'react-native-readium';
import type { HighlightStyleType } from './ReaderHighlightStyleModal';
import { HIGHLIGHT_COLORS } from '../../hooks/useReaderHighlights';
import { useTheme } from '../../theme';

type ReaderHighlightColorModalProps = {
  visible: boolean;
  selectedText?: string;
  onClose: () => void;
  onSave: (color: string, note: string) => void;
};

export function ReaderHighlightColorModal({
  visible,
  selectedText,
  onClose,
  onSave,
}: ReaderHighlightColorModalProps) {
  const { colors, typography } = useTheme();
  const [color, setColor] = useState<string>(HIGHLIGHT_COLORS[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setColor(HIGHLIGHT_COLORS[0]);
      setNote('');
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <Text style={[typography.headline, { color: colors.onSurface }]}>Add highlight</Text>
          {selectedText ? (
            <Text
              numberOfLines={3}
              style={[typography.body, styles.excerpt, { color: colors.onSurfaceVariant }]}>
              “{selectedText}”
            </Text>
          ) : null}

          <View style={styles.colorRow}>
            {HIGHLIGHT_COLORS.map(option => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: color === option }}
                onPress={() => setColor(option)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: option,
                    borderColor: color === option ? colors.primary : colors.outlineVariant,
                    borderWidth: color === option ? 2 : 1,
                  },
                ]}
              />
            ))}
          </View>

          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[
              typography.body,
              styles.noteInput,
              {
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
            value={note}
          />

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSave(color, note.trim())}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[typography.button, { color: colors.onPrimary }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const STYLE_OPTIONS: Array<{ id: HighlightStyleType; label: string }> = [
  { id: 'highlight', label: 'Highlight' },
  { id: 'underline', label: 'Underline' },
  { id: 'squiggly', label: 'Squiggly' },
];

type ReaderHighlightEditModalProps = {
  visible: boolean;
  highlight: Decoration | null;
  onClose: () => void;
  onSave: (id: string, color: string, note: string, styleType: HighlightStyleType) => void;
  onDelete: (id: string) => void;
};

export function ReaderHighlightEditModal({
  visible,
  highlight,
  onClose,
  onSave,
  onDelete,
}: ReaderHighlightEditModalProps) {
  const { colors, typography } = useTheme();
  const [color, setColor] = useState<string>(HIGHLIGHT_COLORS[0]);
  const [note, setNote] = useState('');
  const [styleType, setStyleType] = useState<HighlightStyleType>('highlight');

  useEffect(() => {
    if (visible && highlight) {
      setColor(highlight.style.tint ?? HIGHLIGHT_COLORS[0]);
      setNote(highlight.extras?.note ?? '');
      const stored = highlight.extras?.styleType as HighlightStyleType | undefined;
      if (stored === 'highlight' || stored === 'underline' || stored === 'squiggly') {
        setStyleType(stored);
      } else if (highlight.style.type === 'underline' || highlight.style.type === 'squiggly') {
        setStyleType(highlight.style.type);
      } else {
        setStyleType('highlight');
      }
    }
  }, [highlight, visible]);

  if (!highlight) {
    return null;
  }

  const excerpt =
    highlight.extras?.selectedText?.trim() ||
    highlight.locator.text?.highlight?.trim() ||
    'Highlight';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <Text style={[typography.headline, { color: colors.onSurface }]}>Edit highlight</Text>
          <Text
            numberOfLines={3}
            style={[typography.body, styles.excerpt, { color: colors.onSurfaceVariant }]}>
            {excerpt}
          </Text>

          <View style={styles.styleRow}>
            {STYLE_OPTIONS.map(option => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: styleType === option.id }}
                onPress={() => setStyleType(option.id)}
                style={[
                  styles.styleChip,
                  {
                    backgroundColor:
                      styleType === option.id ? colors.primary : colors.surfaceContainerLow,
                    borderColor:
                      styleType === option.id ? colors.primary : colors.outlineVariant,
                  },
                ]}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color:
                        styleType === option.id ? colors.onPrimary : colors.onSurfaceVariant,
                    },
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.colorRow}>
            {HIGHLIGHT_COLORS.map(option => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: color === option }}
                onPress={() => setColor(option)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: option,
                    borderColor: color === option ? colors.primary : colors.outlineVariant,
                    borderWidth: color === option ? 2 : 1,
                  },
                ]}
              />
            ))}
          </View>

          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Note"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[
              typography.body,
              styles.noteInput,
              {
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
            value={note}
          />

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => onDelete(highlight.id)}>
              <Text style={[typography.button, { color: colors.error }]}>Delete</Text>
            </Pressable>
            <View style={styles.actionsRight}>
              <Pressable accessibilityRole="button" onPress={onClose}>
                <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onSave(highlight.id, color, note.trim(), styleType)}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}>
                <Text style={[typography.button, { color: colors.onPrimary }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: '100%',
  },
  excerpt: {
    marginTop: 4,
  },
  styleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  styleChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorSwatch: {
    borderRadius: 999,
    height: 32,
    width: 32,
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 72,
    padding: 12,
    textAlignVertical: 'top',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionsRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
