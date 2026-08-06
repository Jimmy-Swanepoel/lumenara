import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'
import { formatLongDate } from '../../lib/format'
import { fetchPendingOrganizers, setOrganizerStatus } from '../../lib/api'

export default function Approvals() {
  const router = useRouter()
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchPendingOrganizers()
      setQueue(rows)
    } catch (e) {
      console.log('approvals load error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (!auth.isAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.denied}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text style={styles.deniedText}>Admins only.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const decide = (app, approved) => {
    Alert.alert(
      approved ? 'Approve organiser?' : 'Reject application?',
      approved
        ? `${app.name} will be able to publish events immediately.`
        : `${app.name} will not be able to publish events.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approved ? 'Approve' : 'Reject',
          style: approved ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await setOrganizerStatus(app.id, approved ? 'approved' : 'rejected')
              setQueue((q) => q.filter((a) => a.id !== app.id))
            } catch (e) {
              Alert.alert('Error', e.message ?? 'Could not update. Are you signed in as admin?')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.h1}>Organiser Approvals</Text>
        <Text style={styles.sub}>
          {queue.length} application{queue.length === 1 ? '' : 's'} waiting
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(4) }}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space(8) }} />
        ) : queue.length === 0 ? (
          <EmptyState icon="checkmark-done-outline" title="Nothing to review" subtitle="New organiser applications will appear here" />
        ) : (
          queue.map((app) => (
            <View key={app.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.avatar}>
                  <Text style={styles.initial}>{app.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{app.name}</Text>
                  <Text style={styles.email}>{app.contact_email}</Text>
                </View>
              </View>
              {app.bio ? <Text style={styles.bio}>{app.bio}</Text> : null}
              <Text style={styles.applied}>Applied {formatLongDate(app.applied_at)}</Text>
              <View style={styles.actions}>
                <Button title="Reject" variant="outline" onPress={() => decide(app, false)} style={{ flex: 1 }} />
                <Button title="Approve" onPress={() => decide(app, true)} style={{ flex: 1 }} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2) },
  backText: { fontSize: 17, color: colors.text },
  header: { paddingHorizontal: space(4), paddingTop: space(4) },
  h1: { fontSize: 25, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: space(1) },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space(5), marginBottom: space(4), ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: { width: 50, height: 50, borderRadius: radius.pill, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 21, fontWeight: '800', color: colors.accent },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: space(0.5) },
  bio: { fontSize: 15, color: colors.textMuted, lineHeight: 21, marginTop: space(4) },
  applied: { fontSize: 13, color: colors.textMuted, marginTop: space(3), fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: space(3), marginTop: space(5) },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deniedText: { fontSize: 17, color: colors.textMuted, marginTop: space(3) },
})
