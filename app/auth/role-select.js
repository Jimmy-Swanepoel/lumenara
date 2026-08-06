import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../../lib/themeProvider'

export default function RoleSelect() {
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.h1}>Create your account</Text>
      <Text style={styles.sub}>Choose your account type</Text>

      <View style={styles.options}>
        <Option
          styles={styles}
          colors={colors}
          icon="person-outline"
          iconBg={colors.primaryLight}
          iconColor={colors.primary}
          title="User Account"
          body="Browse, save events & follow organisers"
          onPress={() => router.push('/auth/signup-user')}
        />
        <Option
          styles={styles}
          colors={colors}
          icon="megaphone-outline"
          iconBg={colors.accentLight}
          iconColor={colors.accent}
          title="Organiser Account"
          body="Create & manage events, build your audience"
          onPress={() => router.push('/auth/signup-organizer')}
        />
      </View>
    </SafeAreaView>
  )
}

function Option({ styles, icon, iconBg, iconColor, title, body, onPress }) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionBody}>{body}</Text>
      </View>
    </TouchableOpacity>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2) },
  backText: { fontSize: 17, color: colors.text },
  h1: { fontSize: 27, fontWeight: '800', color: colors.text, paddingHorizontal: space(6), marginTop: space(6) },
  sub: { fontSize: 16, color: colors.textMuted, paddingHorizontal: space(6), marginTop: space(1) },
  options: { padding: space(6), gap: space(4) },
  option: { flexDirection: 'row', alignItems: 'center', gap: space(4), backgroundColor: colors.card, borderRadius: radius.lg, padding: space(5), ...shadow },
  optionIcon: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  optionBody: { fontSize: 15, color: colors.textMuted, marginTop: space(1), lineHeight: 20 },
})
