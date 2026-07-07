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
import type { OpdsCatalog } from '../../types/opds';
import { useTheme } from '../../theme';

export type CatalogFormValues = {
  url: string;
  title: string;
  username?: string;
  password?: string;
  keepExistingPassword?: boolean;
};

type AddCatalogModalProps = {
  visible: boolean;
  catalog?: OpdsCatalog | null;
  onClose: () => void;
  onSubmit: (values: CatalogFormValues) => void;
};

export function AddCatalogModal({
  visible,
  catalog = null,
  onClose,
  onSubmit,
}: AddCatalogModalProps) {
  const { colors, typography } = useTheme();
  const isEditing = catalog != null;
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (catalog) {
      setUrl(catalog.url);
      setTitle(catalog.title);
      setUsername(catalog.username ?? '');
      setPassword('');
    } else {
      setUrl('');
      setTitle('');
      setUsername('');
      setPassword('');
    }
  }, [catalog, visible]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }
    onSubmit({
      url: trimmedUrl,
      title: title.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
      keepExistingPassword: isEditing && password.length === 0,
    });
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>
              {isEditing ? 'Edit catalog' : 'Add OPDS catalog'}
            </Text>
            <Pressable accessibilityRole="button" onPress={handleClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <Field label="Catalog URL" typography={typography} colors={colors}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                onChangeText={setUrl}
                placeholder="https://192.168.1.10:25600/opds/v1.2/catalog"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[inputStyle(colors, typography), styles.input]}
                value={url}
              />
            </Field>
            <Field label="Display name (optional)" typography={typography} colors={colors}>
              <TextInput
                onChangeText={setTitle}
                placeholder="My library"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[inputStyle(colors, typography), styles.input]}
                value={title}
              />
            </Field>
            <Field label="Username (optional)" typography={typography} colors={colors}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setUsername}
                placeholder="For private catalogs"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[inputStyle(colors, typography), styles.input]}
                value={username}
              />
            </Field>
            <Field label="Password (optional)" typography={typography} colors={colors}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setPassword}
                placeholder={
                  isEditing ? 'Leave blank to keep current password' : 'Stored on this device only'
                }
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry
                style={[inputStyle(colors, typography), styles.input]}
                value={password}
              />
            </Field>
          </ScrollView>

          <Text style={[typography.caption, styles.hint, { color: colors.onSurfaceVariant }]}>
            Komga / Tailscale: use http://100.x.x.x:25600/opds/v1.2/catalog or the full
            .ts.net hostname if a short name like meebian fails. Add your Komga username and
            password when the server requires login.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            style={[styles.submit, { backgroundColor: colors.primary }]}>
            <Text style={[typography.button, { color: colors.onPrimary }]}>
              {isEditing ? 'Save changes' : 'Add catalog'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  children,
  typography,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  typography: ReturnType<typeof useTheme>['typography'];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.field}>
      <Text style={[typography.caption, styles.label, { color: colors.outline }]}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function inputStyle(
  colors: ReturnType<typeof useTheme>['colors'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return [
    typography.body,
    {
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLow,
      color: colors.onSurface,
    },
  ];
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
    marginBottom: 16,
  },
  form: {
    gap: 16,
    paddingBottom: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    letterSpacing: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submit: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 16,
  },
  hint: {
    lineHeight: 18,
    marginBottom: 4,
  },
});
