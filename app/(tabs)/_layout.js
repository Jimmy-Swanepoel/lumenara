import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as NavigationBar from 'expo-navigation-bar'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

const ICONS = {
  index: 'home-outline',
  account: 'person-outline',
  create: 'add',
  more: 'menu-outline',
}

// Create is a real tab route (gated by href below) so it gets the same
// persistent bottom tab bar and swipe behaviour as the other tabs - see
// SwipeTabWrapper for how organisers land on it by swiping past Account.
function BottomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 8)
  const styles = makeBarStyles(colors, bottomPad)

  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index
        const { options } = descriptors[route.key]
        const label = options.title ?? route.name
        const color = focused ? colors.primary : colors.textMuted
        const isCreate = route.name === 'create'

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        return (
          <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress}>
            <Ionicons name={ICONS[route.name]} size={isCreate ? 30 : 24} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme()
  const { isOrganizer } = useAuth()

  // Match the Android system navigation bar to the app theme.
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.card)
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colors.card, isDark])

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
      <Tabs.Screen name="create" options={{ title: 'Create', href: isOrganizer ? '/create' : null }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  )
}

const makeBarStyles = (colors, bottomPad) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingBottom: bottomPad,
    height: 58 + bottomPad,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', marginTop: 2, color: colors.textMuted },
})
