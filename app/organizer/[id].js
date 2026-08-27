import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Button from '../../components/Button'
import EventCard from '../../components/EventCard'
import EmptyState from '../../components/EmptyState'
import SignUpPrompt from '../../components/SignUpPrompt'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'
import { isPast } from '../../lib/format'
import {
  fetchOrganizer,
  fetchEventsByOrganizer,
  fetchFollowingIds,
  fetchOrganizerStats,
  followOrganizer,
  unfollowOrganizer,
  avatarUrl,
} from '../../lib/api'

export default function OrganizerProfile() {
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const isSelf = !auth.isGuest && auth.user?.id === id

  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [promptOpen, setPromptOpen] = useState(false)
  const [tab, setTab] = useState('upcoming')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const org = await fetchOrganizer(id)
      setOrganizer(org)
      const ev = await fetchEventsByOrganizer(id)
      setEvents(ev)
      const stats = await fetchOrganizerStats(id)
      setFollowerCount(stats.follower_count ?? 0)
      if (!auth.isGuest && !isSelf) {
        const ids = await fetchFollowingIds()
        setFollowing(ids.includes(id))
      }
    } catch (e) {
      console.log('organizer profile load error', e)
      setOrganizer(null)
    } finally {
      setLoading(false)
    }
  }, [id, auth.isGuest, isSelf])

  useEffect(() => { load() }, [load])

  const onFollow = async () => {
    if (auth.isGuest) {
      setPromptOpen(true)
      return
    }
    if (isSelf) return
    try {
      if (following) {
        await unfollowOrganizer(id)
        setFollowing(false)
      } else {
        await followOrganizer(id)
        setFollowing(true)
      }
    } catch (e) {
      console.log('follow error', e)
    }
  }

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!organizer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.missing}>Organiser not found.</Text>
      </SafeAreaView>
    )
  }

  const upcoming = events.filter((e) => !isPast(e.ends_at))
  const past = events.filter((e) => isPast(e.ends_at))
  const shown = tab === 'upcoming' ? upcoming : past
  const avatar = organizer.avatar_path ? avatarUrl(organizer.avatar_path) : null

  const socials = [
    { key: 'instagram_url', icon: 'logo-instagram', color: '#E1306C' },
    { key: 'facebook_url', icon: 'logo-facebook', color: '#1877F2' },
    { key: 'x_url', icon: 'logo-twitter', color: '#111827' },
    { key: 'tiktok_url', icon: 'logo-tiktok', color: '#111827' },
  ].filter((s) => organizer[s.key])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.initial}>{organizer.name[0]}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{organizer.name}</Text>
              <Text style={styles.followerCount}>
                {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
              </Text>
              {organizer.bio ? <Text style={styles.bio}>{organizer.bio}</Text> : null}
            </View>
          </View>

          {!isSelf ? (
            <Button
              title={following ? 'Following' : 'Follow'}
              variant={following ? 'outline' : 'primary'}
              onPress={onFollow}
              style={{ marginTop: space(4) }}
            />
          ) : null}

          {socials.length > 0 ? (
            <View style={styles.socials}>
              {socials.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.socialBadge, { backgroundColor: s.color }]}
                  onPress={() => Linking.openURL(organizer[s.key])}
                >
                  <Ionicons name={s.icon} size={22} color="#fff" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.segment}>
          <TouchableOpacity style={[styles.segBtn, tab === 'upcoming' && styles.segActive]} onPress={() => setTab('upcoming')}>
            <Text style={[styles.segText, tab === 'upcoming' && styles.segTextActive]}>Upcoming ({upcoming.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segBtn, tab === 'past' && styles.segActive]} onPress={() => setTab('past')}>
            <Text style={[styles.segText, tab === 'past' && styles.segTextActive]}>Past ({past.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: space(4) }}>
          {shown.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={tab === 'upcoming' ? 'No upcoming events' : 'No past events yet'}
            />
          ) : (
            shown.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>

        <View style={{ height: space(8) }} />
      </ScrollView>

      <SignUpPrompt visible={promptOpen} onClose={() => setPromptOpen(false)} action="follow organisers" />
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  missing: { padding: space(8), fontSize: 16, color: colors.textMuted },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(2) },
  backText: { fontSize: 17, color: colors.text },
  header: { backgroundColor: colors.card, paddingHorizontal: space(4), paddingVertical: space(4) },
  row: { flexDirection: 'row', gap: space(4), alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  initial: { fontSize: 30, fontWeight: '800', color: colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  followerCount: { fontSize: 14, color: colors.textMuted, marginTop: space(0.5) },
  bio: { fontSize: 15, color: colors.textMuted, marginTop: space(1.5), lineHeight: 21 },
  socials: { flexDirection: 'row', gap: space(3), marginTop: space(4) },
  socialBadge: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  segment: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(4), marginTop: space(5), marginBottom: space(4) },
  segBtn: { flex: 1, paddingVertical: space(3), borderRadius: radius.md, backgroundColor: colors.inputBg, alignItems: 'center' },
  segActive: { backgroundColor: colors.primary },
  segText: { fontWeight: '700', color: colors.text, fontSize: 15 },
  segTextActive: { color: '#fff' },
})
