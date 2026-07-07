import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

export type HighlightStyleType = 'highlight' | 'underline' | 'squiggly';

const STYLE_OPTIONS: Array<{ id: HighlightStyleType; label: string; description: string }> = [
  { id: 'highlight', label: 'Highlight', description: 'Filled background behind the text.' },
  { id: 'underline', label: 'Underline', description: 'Solid line under the selection.' },
  { id: 'squiggly', label: 'Squiggly', description: 'Shown as underline (wavy style not yet supported).' },
];

type ReaderHighlightStyleModalProps = {
  visible: boolean;
  selectedText?: string;
  onClose: () => void;
  onSelect: (style: HighlightStyleType) => void;
};

export function ReaderHighlightStyleModal({
  visible,
  selectedText,
  onClose,
  onSelect,
}: ReaderHighlightStyleModalProps) {
  const { colors, typography } = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <Text style={[typography.headline, { color: colors.onSurface }]}>Annotation style</Text>
          {selectedText ? (
            <Text
              numberOfLines={3}
              style={[typography.body, styles.excerpt, { color: colors.onSurfaceVariant }]}>
              “{selectedText}”
            </Text>
          ) : null}

          <View style={styles.options}>
            {STYLE_OPTIONS.map(option => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => onSelect(option.id)}
                style={[styles.option, { borderColor: colors.outlineVariant }]}>
                <Text style={[typography.body, { color: colors.onSurface }]}>{option.label}</Text>
                <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                  {option.description}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>Cancel</Text>
          </Pressable>
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
  options: {
    gap: 8,
    marginTop: 4,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  close: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
