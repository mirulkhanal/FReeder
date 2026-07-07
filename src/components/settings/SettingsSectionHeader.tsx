import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme';

type SettingsSectionHeaderProps = {
  icon: string;
  title: string;
  iconColor?: string;
};

export function SettingsSectionHeader({
  icon,
  title,
  iconColor,
}: SettingsSectionHeaderProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={iconColor ?? colors.primary} />
      <Text style={[typography.titleMd, { color: colors.onSurface }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
});
