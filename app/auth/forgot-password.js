import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/themeProvider'

export default function ForgotPassword() {
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your account email.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL('auth/reset-password'),
      })
      if (error) throw error
      setSent(true)
    } catch (e) {
      Alert.alert('Could not send reset email', e.message ?? 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.h1}>Reset password</Text>

        <View style={styles.card}>
          {sent ? (
            <>
              <Text style={styles.body}>
                If an account exists for {email.trim()}, we've sent a link to reset your
                password. Check your inbox (and spam folder).
              </Text>
              <Button
                title="Back to Log In"
                variant="outline"
                onPress={() => router.replace('/auth/login')}
                style={{ marginTop: space(4) }}
              />
            </>
          ) : (
            <>
              <Text style={[styles.body, { marginBottom: space(4) }]}>
                Enter the email you signed up with and we'll send you a link to reset your
                password.
              </Text>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <Button title="Send Reset Link" onPress={submit} loading={busy} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2) },
  backText: { fontSize: 17, color: colors.text },
  h1: { fontSize: 27, fontWeight: '800', color: colors.text, paddingHorizontal: space(6), marginTop: space(5), marginBottom: space(5) },
  card: { backgroundColor: colors.card, marginHorizontal: space(4), borderRadius: radius.lg, padding: space(5), ...shadow },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
})
