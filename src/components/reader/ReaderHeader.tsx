import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme';

type ReaderHeaderProps = {
  visible: boolean;
  bookTitle: string;
  chapterTitle?: string | null;
  favorite: boolean;
  onBack: () => void;
  onOpenInfo: () => void;
  onToggleFavorite: () => void;
  onInteraction: () => void;
  surfaceColor?: string;
  textColor?: string;
  activeIconColor?: string;
};

export function ReaderHeader({
  visible,
  bookTitle,
  chapterTitle,
  favorite,
  onBack,
  onOpenInfo,
  onToggleFavorite,
  onInteraction,
  surfaceColor,
  textColor,
  activeIconColor,
}: ReaderHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  const backgroundColor = surfaceColor ?? 'rgba(255, 255, 255, 0.94)';
  const labelColor = textColor ?? colors.onSurface;
  const favoriteColor = favorite ? (activeIconColor ?? colors.primary) : labelColor;
  const headerTitle = chapterTitle?.trim()
    ? `${bookTitle}: ${chapterTitle.trim()}`
    : bookTitle;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -12,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.root,
        {
          paddingTop: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <View style={[styles.bar, { backgroundColor }]}>
        <Pressable
          accessibilityLabel="Back to library"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            onInteraction();
            onBack();
          }}
          style={styles.iconButton}>
          <Icon name="arrow-back" size={22} color={labelColor} />
        </Pressable>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[typography.titleMd, styles.title, { color: labelColor }]}>
          {headerTitle}
        </Text>
        <Pressable
          accessibilityLabel="Book details"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            onInteraction();
            onOpenInfo();
          }}
          style={styles.iconButton}>
          <Icon name="info-outline" size={20} color={labelColor} />
        </Pressable>
        <Pressable
          accessibilityLabel={favorite ? 'Remove favorite' : 'Add favorite'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            onInteraction();
            onToggleFavorite();
          }}
          style={styles.iconButton}>
          <Icon
            name={favorite ? 'favorite' : 'favorite-border'}
            size={20}
            color={favoriteColor}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
    elevation: 10,
  },
  bar: {
    alignItems: 'center',
    borderRadius: 999,
    elevation: 4,
    flexDirection: 'row',
    gap: 2,
    marginHorizontal: 16,
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
});
