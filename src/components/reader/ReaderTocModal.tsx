import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Link } from 'react-native-readium';
import type { TocLink } from '../../utils/readiumNavigation';
import { useTheme } from '../../theme';

type ReaderTocModalProps = {
  visible: boolean;
  links: TocLink[];
  onClose: () => void;
  onSelect: (link: Link) => void;
};

export function ReaderTocModal({
  visible,
  links,
  onClose,
  onSelect,
}: ReaderTocModalProps) {
  const { colors, typography } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>
              Table of contents
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {links.length === 0 ? (
              <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
                No chapters available for this book.
              </Text>
            ) : (
              <TocTree
                depth={0}
                links={links}
                onSelect={link => {
                  onSelect(link);
                  onClose();
                }}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TocTree({
  links,
  depth,
  onSelect,
}: {
  links: TocLink[];
  depth: number;
  onSelect: (link: Link) => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <>
      {links.map((link, index) => (
        <View key={`${link.href}-${depth}-${index}`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect(link)}
            style={({ pressed }) => [
              styles.item,
              { paddingLeft: 12 + depth * 16 },
              pressed && { backgroundColor: colors.surfaceContainerHigh },
            ]}>
            <Text
              numberOfLines={2}
              style={[
                typography.body,
                depth > 0 && styles.nestedTitle,
                { color: colors.onSurface },
              ]}>
              {link.title || link.href}
            </Text>
          </Pressable>
          {link.children && link.children.length > 0 ? (
            <TocTree depth={depth + 1} links={link.children} onSelect={onSelect} />
          ) : null}
        </View>
      ))}
    </>
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
  list: {
    gap: 2,
    paddingBottom: 16,
  },
  item: {
    borderRadius: 10,
    paddingRight: 12,
    paddingVertical: 12,
  },
  nestedTitle: {
    fontSize: 15,
  },
});
