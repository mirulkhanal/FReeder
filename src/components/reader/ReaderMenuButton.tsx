import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ReaderMenuButtonProps = {
  visible: boolean;
  chromeVisible: boolean;
  onPress: () => void;
  surfaceColor: string;
  iconColor: string;
};

export function ReaderMenuButton({
  visible,
  chromeVisible,
  onPress,
  surfaceColor,
  iconColor,
}: ReaderMenuButtonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: chromeVisible ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [chromeVisible, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={chromeVisible ? 'none' : 'box-none'}
      style={[styles.root, { opacity }]}
    >
      <Pressable
        accessibilityLabel="Show reader menu"
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: surfaceColor,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Icon color={iconColor} name="menu" size={22} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    bottom: 20,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  button: {
    alignItems: 'center',
    borderRadius: 999,
    elevation: 4,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    width: 48,
  },
});
