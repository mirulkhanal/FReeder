import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme';

type LibrarySearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
};

export function LibrarySearchBar({
  value,
  onChangeText,
  onClose,
}: LibrarySearchBarProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <Icon name="search" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          clearButtonMode="while-editing"
          placeholder="Search by title or author"
          placeholderTextColor={colors.onSurfaceVariant}
          returnKeyType="search"
          style={[typography.body, styles.input, { color: colors.onSurface }]}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close search"
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && { backgroundColor: colors.surfaceContainerHigh },
        ]}>
        <Icon name="close" size={22} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  field: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
});
