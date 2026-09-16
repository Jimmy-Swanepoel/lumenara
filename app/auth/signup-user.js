import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

export default function SignUpUser() {
  const router = useRouter()
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      await auth.signUpUser({ email: email.trim(), password, username: username.trim() })
      router.replace({ pathname: '/auth/confirm', params: { email: email.trim() } })
    } catch (e) {
      Alert.alert('Sign up failed', e.message ?? 'Please try again.')
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

        <Text style={styles.h1}>Sign up</Text>

        <View style={styles.card}>
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="Choose a username" autoCapitalize="none" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
          <Button title="Create Account" onPress={submit} loading={busy} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space(5) },
  footerText: { fontSize: 15, color: colors.textMuted },
  link: { fontSize: 15, color: colors.primary, fontWeight: '700' },
})
