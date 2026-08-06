import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Button from '../../components/Button'
import { useTheme } from '../../lib/themeProvider'

export default function Welcome() {
  const router = useRouter()
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>Welcome to Lumenara</Text>
        <Text style={styles.body}>
          Create an account to save events, follow organisers, and get
          personalised recommendations.
        </Text>

        <View style={styles.actions}>
          <Button title="Sign Up" onPress={() => router.push('/auth/role-select')} />
          <Button title="Log In" variant="outline" onPress={() => router.push('/auth/login')} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(6) },
  avatar: { width: 100, height: 100, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 25, fontWeight: '800', color: colors.text, marginTop: space(6) },
  body: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: space(3), lineHeight: 23 },
  actions: { alignSelf: 'stretch', gap: space(3), marginTop: space(8) },
})
