import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

export default function Login() {
  const router = useRouter()
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.')
      return
    }
    setBusy(true)
    try {
      await auth.signIn({ email: email.trim(), password })
      router.replace('/(tabs)/account')
    } catch (e) {
      Alert.alert('Login failed', e.message ?? 'Please check your details and try again.')
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

        <Text style={styles.h1}>Log in</Text>

        <View style={styles.card}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />
          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
          <Button title="Log In" onPress={submit} loading={busy} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/role-select')}>
            <Text style={styles.link}>Sign up</Text>
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
  forgot: { alignSelf: 'flex-end', marginBottom: space(4) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space(5) },
  footerText: { fontSize: 15, color: colors.textMuted },
  link: { fontSize: 15, color: colors.primary, fontWeight: '700' },
})
