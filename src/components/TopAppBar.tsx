import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../theme';

type TopAppBarProps = {
  onSearchPress?: () => void;
};

export function TopAppBar({ onSearchPress }: TopAppBarProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface }]}>
      <View style={styles.brand}>
        <View
          style={[
            styles.logoMark,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View
            style={[
              styles.logoMarkInner,
              { backgroundColor: colors.primaryContainer },
            ]}
          />
          <Icon
            name="auto-stories"
            size={22}
            color={colors.onPrimary}
            style={styles.logoIcon}
          />
        </View>
        <View style={styles.brandText}>
          <View style={styles.wordmarkRow}>
            <Text style={[styles.wordmarkAccent, { color: colors.primary }]}>
              F
            </Text>
            <Text style={[styles.wordmarkRest, { color: colors.onSurface }]}>
              Reeder
            </Text>
            <View
              style={[
                styles.wordmarkDot,
                { backgroundColor: colors.tertiaryFixedDim },
              ]}
            />
          </View>
          <Text
            style={[
              typography.caption,
              styles.tagline,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Read freely
          </Text>
        </View>
      </View>
      {onSearchPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={onSearchPress}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Icon name="search" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : (
        <View style={styles.iconSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logoMark: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    width: 44,
  },
  logoMarkInner: {
    bottom: -8,
    height: 24,
    opacity: 0.35,
    position: 'absolute',
    right: -8,
    transform: [{ rotate: '24deg' }],
    width: 24,
  },
  logoIcon: {
    zIndex: 1,
  },
  brandText: {
    gap: 2,
  },
  wordmarkRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  wordmarkAccent: {
    fontFamily: 'serif',
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 32,
    marginRight: -1,
  },
  wordmarkRest: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 32,
  },
  wordmarkDot: {
    borderRadius: 999,
    height: 6,
    marginBottom: 6,
    marginLeft: 4,
    width: 6,
  },
  tagline: {
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  iconButton: {
    borderRadius: 999,
    padding: 8,
  },
  iconSpacer: {
    width: 40,
  },
});
