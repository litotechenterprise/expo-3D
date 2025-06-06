import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { statusOptions } from '@/constants';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Custom tab icon component for color indicators
const ColorTabIcon = ({ color, statusColor, focused }: { color: string; statusColor: string; focused: boolean }) => (
  <View 
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: statusColor,
      borderWidth: focused ? 3 : 2,
      borderColor: focused ? '#ffffff' : '#666666',
    }}
  />
);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      {statusOptions.map((status, index) => (
        <Tabs.Screen
          key={status.name}
          name={index === 0 ? 'index' : `color${index}`}
          options={{
            title: status.name.split(' ')[0], // Show just first word (Blue, Silver, etc.)
            tabBarIcon: ({ color, focused }) => (
              <ColorTabIcon color={color} statusColor={status.color} focused={focused} />
            ),
          }}
          initialParams={{ statusColor: status.color, statusName: status.name }}
        />
      ))}
    </Tabs>
  );
}
