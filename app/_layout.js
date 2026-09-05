import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../lib/auth'
import { ThemeProvider, useTheme } from '../lib/themeProvider'
import NotificationsGate from '../components/NotificationsGate'

function ThemedStatusBar() {
  const { isDark } = useTheme()
  return <StatusBar style={isDark ? 'light' : 'dark'} />
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStatusBar />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/welcome" />
              <Stack.Screen name="auth/role-select" />
              <Stack.Screen name="auth/signup-user" />
              <Stack.Screen name="auth/signup-organizer" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="event/[id]" />
              <Stack.Screen name="event/edit/[id]" />
              <Stack.Screen name="organizer/[id]" />
              <Stack.Screen name="admin/approvals" />
            </Stack>
            <NotificationsGate />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
