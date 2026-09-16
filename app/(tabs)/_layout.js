import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { withLayoutContext } from 'expo-router'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as NavigationBar from 'expo-navigation-bar'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

// Material top tabs is backed by react-native-pager-view - a real native
// ViewPager - repositioned to the bottom via tabBarPosition below. Unlike
// expo-router's default <Tabs> (which just swaps one absolutely-positioned
// screen for another with no in-between state), this lays every tab out
// side by side in one continuous strip, so dragging genuinely drags the
// current screen off and the neighbouring one's real content into view -
// no separate gesture handler or fake slide-in animation needed.
const { Navigator } = createMaterialTopTabNavigator()
// `useOnlyUserDefinedScreens: true` - without this, expo-router auto-injects
// every file under app/(tabs)/ as an implicit extra screen even when it has
// no explicit <Screen> here, appended after the declared ones. That defeated
// the conditional `create` screen below (it kept reappearing at the end for
// non-organisers instead of being excluded).
const MaterialTopTabs = withLayoutContext(Navigator, undefined, true)

const ICONS = {
  index: 'home-outline',
  account: 'person-outline',
  create: 'add',
  more: 'menu-outline',
}

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
    <MaterialTopTabs
      tabBar={(props) => <BottomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{ sceneStyle: { backgroundColor: colors.bg }, animationEnabled: false }}
    >
      <MaterialTopTabs.Screen name="index" options={{ title: 'Home' }} />
      <MaterialTopTabs.Screen name="account" options={{ title: 'Account' }} />
      {isOrganizer ? <MaterialTopTabs.Screen name="create" options={{ title: 'Create' }} /> : null}
      <MaterialTopTabs.Screen name="more" options={{ title: 'More' }} />
    </MaterialTopTabs>
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
