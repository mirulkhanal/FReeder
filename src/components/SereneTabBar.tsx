import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme';

const TAB_ICONS: Record<string, string> = {
  LibraryTab: 'library-books',
  DiscoverTab: 'explore',
  SettingsTab: 'settings',
};

const TAB_LABELS: Record<string, string> = {
  LibraryTab: 'Library',
  DiscoverTab: 'Discover',
  SettingsTab: 'Settings',
};

export function SereneTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? 'circle';
          const label = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}>
              <Icon
                name={iconName}
                size={24}
                color={isFocused ? colors.primary : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  typography.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.onSurfaceVariant,
                    marginTop: 4,
                  },
                ]}>
                {label}
              </Text>
              {isFocused ? (
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.surfaceContainerHigh },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  tabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  dot: {
    borderRadius: 2,
    height: 4,
    marginTop: 6,
    width: 4,
  },
  dotPlaceholder: {
    height: 4,
    marginTop: 6,
    width: 4,
  },
  progressTrack: {
    height: 1,
    width: '100%',
  },
});
