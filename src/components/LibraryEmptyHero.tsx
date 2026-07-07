import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../theme';

type LibraryEmptyHeroProps = {
  onSelectFolder: () => void;
  onImportFile: () => void;
  loading?: boolean;
};

export function LibraryEmptyHero({
  onSelectFolder,
  onImportFile,
  loading = false,
}: LibraryEmptyHeroProps) {
  const { colors, typography } = useTheme();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -12,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[styles.hero, { transform: [{ translateY: float }] }]}
      >
        <View
          style={[
            styles.glow,
            { backgroundColor: colors.primaryContainerGlow },
          ]}
        />
        <View style={styles.heroInner}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: 'rgba(255,255,255,0.4)',
                shadowColor: '#000',
              },
            ]}
          >
            <View
              style={[
                styles.dashedBox,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Icon name="menu-book" size={48} color={colors.outline} />
              <Icon name="add-circle" size={28} color={colors.primary} />
            </View>
            <View
              style={[
                styles.blobTop,
                { backgroundColor: colors.tertiaryFixedDimGlow },
              ]}
            />
            <View
              style={[
                styles.blobBottom,
                { backgroundColor: colors.primaryFixedDimGlow },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      <View style={styles.copy}>
        <Text
          style={[
            typography.headline,
            styles.title,
            { color: colors.onSurface },
          ]}
        >
          Your library is empty
        </Text>
        <Text
          style={[
            typography.body,
            styles.description,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Import DRM-free EPUB files from a folder or add them one at a time.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onSelectFolder}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.shadowPrimary,
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Icon name="folder-open" size={20} color={colors.onPrimary} />
            <Text style={[typography.button, { color: colors.onPrimary }]}>
              Choose library folder
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onImportFile}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            borderColor: colors.outlineVariant,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Icon name="upload-file" size={20} color={colors.primary} />
        <Text style={[typography.button, { color: colors.primary }]}>
          Add EPUB file
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 448,
    paddingHorizontal: 20,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    height: 256,
    justifyContent: 'center',
    marginBottom: 40,
    width: 256,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
  },
  heroInner: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    elevation: 2,
    padding: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  dashedBox: {
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 12,
    height: 176,
    justifyContent: 'center',
    width: 128,
  },
  blobTop: {
    borderRadius: 999,
    height: 48,
    position: 'absolute',
    right: -16,
    top: -16,
    width: 48,
  },
  blobBottom: {
    borderRadius: 999,
    bottom: -24,
    height: 64,
    left: -8,
    position: 'absolute',
    width: 64,
  },
  copy: {
    gap: 16,
    marginBottom: 0,
    maxWidth: 320,
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    opacity: 0.8,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    elevation: 4,
    flexDirection: 'row',
    gap: 12,
    marginTop: 48,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
});
