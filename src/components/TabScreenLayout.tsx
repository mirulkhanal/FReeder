import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

import { LibrarySearchBar } from './LibrarySearchBar';
import { TopAppBar } from './TopAppBar';

type TabScreenLayoutProps = ViewProps & {
  children: React.ReactNode;
  onSearchPress?: () => void;
  searchActive?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearchClose?: () => void;
};

export function TabScreenLayout({
  children,
  style,
  onSearchPress,
  searchActive = false,
  searchQuery = '',
  onSearchQueryChange,
  onSearchClose,
  ...rest
}: TabScreenLayoutProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }, style]}
      {...rest}
    >
      <SafeAreaView
        edges={['top']}
        style={[styles.headerSafe, { backgroundColor: colors.surface }]}
      >
        <TopAppBar onSearchPress={onSearchPress} />
        {searchActive && onSearchQueryChange && onSearchClose ? (
          <LibrarySearchBar
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            onClose={onSearchClose}
          />
        ) : null}
      </SafeAreaView>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerSafe: {
    width: '100%',
  },
  content: {
    flex: 1,
  },
});
