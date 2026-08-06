import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

export default function TabsLayout() {
  const { isOrganizer } = useAuth()
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 8)

  // Match the Android system navigation bar to the app theme.
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.card)
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colors.card, isDark])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          href: isOrganizer ? '/create' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size + 6} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
