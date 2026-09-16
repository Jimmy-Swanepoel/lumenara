import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import Button from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { parseAuthTokensFromUrl, useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

// Shown right after signup instead of "check your email, now go log in".
// Tapping the confirmation link opens this same screen via a deep link
// carrying the new session's tokens - establishing that session fires
// AuthProvider's onAuthStateChange, and the effect below then bounces
// straight to the home tab. No manual log-in step needed.
export default function ConfirmEmail() {
  const router = useRouter()
  const auth = useAuth()
  const { email } = useLocalSearchParams()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  const handled = useRef(false)

  useEffect(() => {
    const establish = async (url) => {
      if (handled.current || !url) return
      const tokens = parseAuthTokensFromUrl(url)
      if (!tokens) return
      handled.current = true
      try {
        if (tokens.kind === 'implicit') {
          await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })
        } else {
          await supabase.auth.exchangeCodeForSession(tokens.code)
        }
      } catch (e) {
        console.log('confirm email error', e)
        handled.current = false
      }
    }

    Linking.getInitialURL().then(establish)
    const sub = Linking.addEventListener('url', ({ url }) => establish(url))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (auth.session) router.replace('/(tabs)')
  }, [auth.session])

  return (
    <SafeAreaView style={[styles.safe, styles.center]}>
      <View style={styles.iconWrap}>
        <Ionicons name="mail-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.h1}>Check your email</Text>
      <Text style={styles.body}>
        {email
          ? `We've sent a confirmation link to ${email}.`
          : "We've sent a confirmation link to your email address."}
        {' '}Tap it to activate your account - you'll land right back here and be signed in
        automatically.
      </Text>
      <ActivityIndicator style={{ marginTop: space(6) }} color={colors.primary} />
      <Button
        title="Back to Log In"
        variant="outline"
        onPress={() => router.replace('/auth/login')}
        style={{ marginTop: space(8), alignSelf: 'stretch' }}
      />
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: space(8) },
  iconWrap: {
    width: 76, height: 76, borderRadius: radius.pill, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: space(5),
  },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: space(3) },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 21, textAlign: 'center' },
})
