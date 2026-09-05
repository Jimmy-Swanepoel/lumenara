import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import SwipeTabWrapper from '../../components/SwipeTabWrapper'
import Button from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function More() {
  const auth = useAuth()
  const router = useRouter()
  const { colors, radius, space, shadow, pref, setPreference } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const toggleSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setSettingsOpen((o) => !o)
  }

  const s = makeStyles(colors, radius, space, shadow)

  return (
    <SwipeTabWrapper name="more">
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>More</Text>

        <View style={s.group}>
          <Row s={s} colors={colors} icon="help-circle-outline" label="Help" />
          <Row s={s} colors={colors} icon="document-text-outline" label="Terms & Services" />

          {/* Settings: inline accordion */}
          <TouchableOpacity style={s.row} onPress={toggleSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
            <Text style={s.rowLabel}>Settings</Text>
            <Ionicons
              name={settingsOpen ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {settingsOpen ? (
            <View style={s.accordion}>
              <SubRow s={s} colors={colors} icon="notifications-outline" label="Notifications" />
              <SubRow s={s} colors={colors} icon="lock-closed-outline" label="Privacy" />
              <SubRow s={s} colors={colors} icon="information-circle-outline" label="About Lumenara" />

              <View style={s.themeBlock}>
                <View style={s.themeHeader}>
                  <Ionicons name="moon-outline" size={20} color={colors.text} />
                  <Text style={s.themeLabel}>Appearance</Text>
                </View>
                <View style={s.segment}>
                  {[
                    { key: 'system', label: 'System' },
                    { key: 'light', label: 'Light' },
                    { key: 'dark', label: 'Dark' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[s.segBtn, pref === opt.key && s.segActive]}
                      onPress={() => setPreference(opt.key)}
                    >
                      <Text style={[s.segText, pref === opt.key && s.segTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {auth.isAdmin ? (
          <>
            <Text style={s.sectionLabel}>Admin</Text>
            <View style={s.group}>
              <Row
                s={s}
                colors={colors}
                icon="shield-checkmark-outline"
                label="Organiser Approvals"
                chevron
                onPress={() => router.push('/admin/approvals')}
              />
            </View>
          </>
        ) : null}

        {!auth.isGuest ? (
          <View style={{ paddingHorizontal: space(4), marginTop: space(6) }}>
            <Button title="Sign Out" variant="outline" onPress={auth.signOut} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: space(4), marginTop: space(6), gap: space(3) }}>
            <Button title="Sign Up" onPress={() => router.push('/auth/role-select')} />
            <Button title="Log In" variant="outline" onPress={() => router.push('/auth/login')} />
          </View>
        )}

        <View style={{ height: space(10) }} />
      </ScrollView>
    </SafeAreaView>
    </SwipeTabWrapper>
  )
}

function Row({ s, colors, icon, label, chevron, onPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={s.rowLabel}>{label}</Text>
      {chevron ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
    </TouchableOpacity>
  )
}

function SubRow({ s, colors, icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.subRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={s.subRowLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function makeStyles(colors, radius, space, shadow) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    h1: {
      fontSize: 27, fontWeight: '800', color: colors.text,
      paddingHorizontal: space(4), paddingTop: space(3), paddingBottom: space(4),
    },
    sectionLabel: {
      fontSize: 13, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.6,
      paddingHorizontal: space(4), marginTop: space(6), marginBottom: space(2),
    },
    group: {
      backgroundColor: colors.card, marginHorizontal: space(4),
      borderRadius: radius.lg, overflow: 'hidden', ...shadow,
    },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space(4),
      paddingHorizontal: space(4), paddingVertical: space(4.5),
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    rowLabel: { flex: 1, fontSize: 17, color: colors.text },
    accordion: { backgroundColor: colors.bg },
    subRow: {
      flexDirection: 'row', alignItems: 'center', gap: space(4),
      paddingHorizontal: space(6), paddingVertical: space(4),
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    subRowLabel: { flex: 1, fontSize: 16, color: colors.text },
    themeBlock: { paddingHorizontal: space(6), paddingVertical: space(4) },
    themeHeader: { flexDirection: 'row', alignItems: 'center', gap: space(4), marginBottom: space(3) },
    themeLabel: { fontSize: 16, color: colors.text },
    segment: { flexDirection: 'row', gap: space(2), backgroundColor: colors.inputBg, borderRadius: radius.md, padding: space(1) },
    segBtn: { flex: 1, paddingVertical: space(2.5), borderRadius: radius.sm, alignItems: 'center' },
    segActive: { backgroundColor: colors.primary },
    segText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
    segTextActive: { color: '#fff' },
  })
}
