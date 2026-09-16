import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { parseAuthTokensFromUrl } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

export default function ResetPassword() {
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [verifying, setVerifying] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const handled = useRef(false)

  useEffect(() => {
    const establish = async (url) => {
      if (handled.current || !url) return
      const tokens = parseAuthTokensFromUrl(url)
      if (!tokens) return
      handled.current = true
      try {
        const { error } =
          tokens.kind === 'implicit'
            ? await supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
              })
            : await supabase.auth.exchangeCodeForSession(tokens.code)
        if (error) throw error
        setReady(true)
      } catch (e) {
        Alert.alert('Link expired', e.message ?? 'Please request a new reset link.')
      } finally {
        setVerifying(false)
      }
    }

    Linking.getInitialURL().then((url) => {
      establish(url).finally(() => {
        if (!handled.current) setVerifying(false)
      })
    })
    const sub = Linking.addEventListener('url', ({ url }) => establish(url))
    return () => sub.remove()
  }, [])

  const submit = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.')
      return
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", 'Please re-enter your new password.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      Alert.alert('Password updated', 'You can now use your new password to log in.')
      router.replace('/(tabs)/account')
    } catch (e) {
      Alert.alert('Could not update password', e.message ?? 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (verifying) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Verifying your link...</Text>
      </SafeAreaView>
    )
  }

  if (!ready) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.h1}>Link expired</Text>
        <Text style={[styles.muted, { textAlign: 'center', marginTop: space(2) }]}>
          This reset link is invalid or has expired. Request a new one from the login screen.
        </Text>
        <Button
          title="Back to Log In"
          variant="outline"
          onPress={() => router.replace('/auth/login')}
          style={{ marginTop: space(6), alignSelf: 'stretch' }}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.card}>
        <Text style={styles.h1}>Set a new password</Text>
        <Field
          label="New password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
        />
        <Field
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter password"
          secureTextEntry
        />
        <Button title="Update Password" onPress={submit} loading={busy} />
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: space(8) },
  muted: { fontSize: 15, color: colors.textMuted, marginTop: space(3) },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: space(4) },
  card: { backgroundColor: colors.card, margin: space(4), marginTop: space(10), borderRadius: radius.lg, padding: space(5), ...shadow },
})
