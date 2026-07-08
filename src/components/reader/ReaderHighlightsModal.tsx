import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../../theme';

import type { Decoration } from 'react-native-readium';

type ReaderHighlightsModalProps = {
  visible: boolean;
  highlights: Decoration[];
  onClose: () => void;
  onSelect: (decoration: Decoration) => void;
  onEdit: (decoration: Decoration) => void;
};

export function ReaderHighlightsModal({
  visible,
  highlights,
  onClose,
  onSelect,
  onEdit,
}: ReaderHighlightsModalProps) {
  const { colors, typography } = useTheme();

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
              Highlights
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>
                Close
              </Text>
            </Pressable>
          </View>

          <Text
            style={[
              typography.caption,
              styles.hint,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Select text in the book and choose Highlight. Tap a highlight here
            to jump to it.
          </Text>

          <ScrollView contentContainerStyle={styles.list}>
            {highlights.length === 0 ? (
              <Text
                style={[
                  typography.body,
                  styles.empty,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                No highlights yet.
              </Text>
            ) : (
              highlights.map(highlight => {
                const tint = highlight.style.tint ?? '#FFF59D';
                const excerpt =
                  highlight.extras?.selectedText?.trim() ||
                  highlight.locator.text?.highlight?.trim() ||
                  'Highlight';
                const note = highlight.extras?.note?.trim();

                return (
                  <Pressable
                    key={highlight.id}
                    accessibilityRole="button"
                    onPress={() => {
                      onSelect(highlight);
                      onClose();
                    }}
                    onLongPress={() => onEdit(highlight)}
                    style={({ pressed }) => [
                      styles.item,
                      {
                        backgroundColor: pressed
                          ? colors.surfaceContainerHigh
                          : colors.surfaceContainerLow,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={[styles.swatch, { backgroundColor: tint }]} />
                    <View style={styles.copy}>
                      <Text
                        numberOfLines={3}
                        style={[typography.body, { color: colors.onSurface }]}
                      >
                        {excerpt}
                      </Text>
                      {note ? (
                        <Text
                          numberOfLines={2}
                          style={[
                            typography.caption,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          {note}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
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
    marginBottom: 8,
  },
  hint: {
    marginBottom: 12,
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
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  swatch: {
    borderRadius: 4,
    height: 32,
    marginTop: 2,
    width: 6,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
