import { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Shared tokens that don't change between light and dark.
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }
export const space = (n) => n * 4

// ---- palettes ----
const light = {
  primary: '#5B5BD6',
  primaryLight: '#E8E8FB',
  accent: '#F5A623',
  accentLight: '#FDF0DC',
  bg: '#F4F4F6',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
  inputBg: '#EFEFF2',
  chipBg: '#EFEFF2',
  scrim: 'rgba(244,244,246,0.55)',
  shadowOpacity: 0.06,
}

const dark = {
  primary: '#8B8BF0',
  primaryLight: '#2A2A44',
  accent: '#F5A623',
  accentLight: '#3A2E1A',
  bg: '#0F0F14',
  card: '#1A1A22',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  border: '#2A2A33',
  danger: '#F87171',
  success: '#4ADE80',
  inputBg: '#22222C',
  chipBg: '#22222C',
  scrim: 'rgba(0,0,0,0.55)',
  shadowOpacity: 0.25,
}

// 'system' | 'light' | 'dark'
const STORAGE_KEY = 'themePref'

const ThemeContext = createContext({})
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme() // 'light' | 'dark' | null
  const [pref, setPref] = useState('system')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPref(v)
      setLoaded(true)
    })
  }, [])

  const setPreference = (p) => {
    setPref(p)
    AsyncStorage.setItem(STORAGE_KEY, p)
  }

  const effective =
    pref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : pref

  const colors = effective === 'dark' ? dark : light

  const shadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 6,
    elevation: 2,
  }

  const value = {
    colors,
    shadow,
    radius,
    space,
    isDark: effective === 'dark',
    pref,
    setPreference,
    loaded,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
