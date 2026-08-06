import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../lib/auth'
import { ThemeProvider, useTheme } from '../lib/themeProvider'

function ThemedStatusBar() {
  const { isDark } = useTheme()
  return <StatusBar style={isDark ? 'light' : 'dark'} />
}

export default function RootLayout() {
  return (
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
            <Stack.Screen name="organizer/[id]" />
            <Stack.Screen name="admin/approvals" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
