import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import { SereneTabBar } from '../components/SereneTabBar';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useTheme } from '../theme';

import type { MainTabParamList } from './types';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useTheme();
  const renderTabBar = React.useCallback(
    (props: BottomTabBarProps) => <SereneTabBar {...props} />,
    [],
  );

  return (
    <Tab.Navigator
      id="main-tabs"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="LibraryTab" component={LibraryScreen} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
