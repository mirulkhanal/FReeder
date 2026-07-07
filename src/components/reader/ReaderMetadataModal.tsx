import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PublicationMetadata } from 'react-native-readium';
import { useTheme } from '../../theme';

type ReaderMetadataModalProps = {
  visible: boolean;
  metadata: PublicationMetadata | null;
  onClose: () => void;
};

export function ReaderMetadataModal({
  visible,
  metadata,
  onClose,
}: ReaderMetadataModalProps) {
  const { colors, typography } = useTheme();

  if (!metadata) {
    return null;
  }

  const authors = metadata.author?.map(person => person.name).filter(Boolean) ?? [];
  const publisher = metadata.publisher?.[0]?.name;
  const languages = metadata.language?.join(', ');
  const subjects = metadata.subject?.map(item => item.name).filter(Boolean) ?? [];
  const series = metadata.belongsTo?.series?.[0]?.name;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>About this book</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <MetadataField label="Title" value={metadata.title} />
            {metadata.subtitle ? (
              <MetadataField label="Subtitle" value={metadata.subtitle} />
            ) : null}
            {authors.length > 0 ? (
              <MetadataField label="Author" value={authors.join(', ')} />
            ) : null}
            {publisher ? <MetadataField label="Publisher" value={publisher} /> : null}
            {metadata.published ? (
              <MetadataField label="Published" value={formatDate(metadata.published)} />
            ) : null}
            {languages ? <MetadataField label="Language" value={languages} /> : null}
            {series ? <MetadataField label="Series" value={series} /> : null}
            {metadata.identifier ? (
              <MetadataField label="Identifier" value={metadata.identifier} />
            ) : null}
            {metadata.numberOfPages != null ? (
              <MetadataField label="Pages" value={String(metadata.numberOfPages)} />
            ) : null}
            {subjects.length > 0 ? (
              <MetadataField label="Subjects" value={subjects.join(', ')} />
            ) : null}
            {metadata.description ? (
              <MetadataField label="Description" value={stripHtml(metadata.description)} />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MetadataField({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[typography.caption, styles.label, { color: colors.onSurfaceVariant }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[typography.body, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
    maxHeight: '82%',
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
  content: {
    gap: 16,
    paddingBottom: 16,
  },
  field: {
    gap: 4,
  },
  label: {
    letterSpacing: 1,
  },
});
