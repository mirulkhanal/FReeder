import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ReaderToolbarProps = {
  visible: boolean;
  onOpenToc: () => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  onOpenHighlights: () => void;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  onInteraction: () => void;
  surfaceColor?: string;
  iconColor?: string;
};

export function ReaderToolbar({
  visible,
  onOpenToc,
  onOpenSearch,
  onOpenBookmarks,
  onOpenHighlights,
  onOpenProgress,
  onOpenSettings,
  onInteraction,
  surfaceColor,
  iconColor = '#1a1c1d',
}: ReaderToolbarProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const backgroundColor = surfaceColor ?? 'rgba(255, 255, 255, 0.94)';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 12,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  const wrap = (action: () => void) => () => {
    onInteraction();
    action();
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.root, { opacity, transform: [{ translateY }] }]}
    >
      <Animated.View style={[styles.group, { backgroundColor }]}>
        <ToolbarButton
          icon="list"
          label="Contents"
          iconColor={iconColor}
          onPress={wrap(onOpenToc)}
        />
        <ToolbarButton
          icon="search"
          label="Search"
          iconColor={iconColor}
          onPress={wrap(onOpenSearch)}
        />
        <ToolbarButton
          icon="bookmark"
          label="Bookmarks"
          iconColor={iconColor}
          onPress={wrap(onOpenBookmarks)}
        />
        <ToolbarButton
          icon="border-color"
          label="Highlights"
          iconColor={iconColor}
          onPress={wrap(onOpenHighlights)}
        />
        <ToolbarButton
          icon="linear-scale"
          label="Progress"
          iconColor={iconColor}
          onPress={wrap(onOpenProgress)}
        />
        <ToolbarButton
          icon="tune"
          label="Settings"
          iconColor={iconColor}
          onPress={wrap(onOpenSettings)}
        />
      </Animated.View>
    </Animated.View>
  );
}

type ToolbarButtonProps = {
  icon: string;
  label: string;
  onPress: () => void;
  iconColor: string;
};

function ToolbarButton({
  icon,
  label,
  onPress,
  iconColor,
}: ToolbarButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Icon name={icon} size={20} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    bottom: 24,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  group: {
    alignSelf: 'center',
    borderRadius: 999,
    elevation: 4,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
