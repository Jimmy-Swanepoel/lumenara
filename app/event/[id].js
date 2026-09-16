import { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import SignUpPrompt from '../../components/SignUpPrompt'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth'
import { categoryLabel, categoryStyle, CATEGORY_GRADIENT } from '../../lib/theme'
import { useTheme } from '../../lib/themeProvider'
import { formatLongDate, formatTime } from '../../lib/format'
import {
  fetchEventById,
  fetchOrganizer,
  eventImageUrl,
  avatarUrl,
  fetchSavedIds,
  saveEvent,
  unsaveEvent,
  cancelEvent,
} from '../../lib/api'

export default function EventDetail() {
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const auth = useAuth()

  const [event, setEvent] = useState(null)
  const [organizer, setOrganizer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwner = !auth.isGuest && auth.user?.id === event?.organizer_id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const ev = await fetchEventById(id)
      setEvent(ev)
      try {
        const org = await fetchOrganizer(ev.organizer_id)
        setOrganizer(org)
      } catch (e) {
        console.log('organizer fetch error', e)
        setOrganizer(null)
      }
      if (!auth.isGuest) {
        const ids = await fetchSavedIds()
        setSaved(ids.includes(id))
      }
    } catch (e) {
      console.log('event detail load error', e)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }, [id, auth.isGuest])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onSave = async () => {
    if (auth.isGuest) {
      setPromptOpen(true)
      return
    }
    try {
      if (saved) {
        await unsaveEvent(id)
        setSaved(false)
      } else {
        await saveEvent(id)
        setSaved(true)
      }
    } catch (e) {
      console.log('save error', e)
    }
  }

  const onDelete = () => {
    Alert.alert(
      'Cancel this event?',
      'Everyone who saved it will be notified. This can\'t be undone.',
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: 'Cancel event',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await cancelEvent(id, `${event.title} was cancelled by the organiser.`)
              router.back()
            } catch (e) {
              Alert.alert('Could not cancel event', e.message ?? 'Please try again.')
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backPlain} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.missing}>Event not found.</Text>
      </SafeAreaView>
    )
  }

  const cat = categoryStyle(event.category)
  const gradient = CATEGORY_GRADIENT[event.category] ?? [colors.primary, colors.primary]
  const imgUrl = event.image_path ? eventImageUrl(event.image_path) : null

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: cat.bg }]}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={styles.heroEmoji}>{cat.emoji}</Text>
          )}
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: space(2.5) }}>
              {isOwner ? (
                <>
                  <TouchableOpacity style={styles.circleBtn} onPress={() => router.push(`/event/edit/${id}`)}>
                    <Ionicons name="create-outline" size={19} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.circleBtn} onPress={onDelete} disabled={deleting}>
                    {deleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="trash-outline" size={19} color="#fff" />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.circleBtn} onPress={onSave}>
                  <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.sheet}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.catBadge}
          >
            <Text style={styles.catText}>{categoryLabel(event.category)}</Text>
          </LinearGradient>

          <Text style={styles.title}>{event.title}</Text>

          <MetaRow icon="calendar-outline" text={formatLongDate(event.starts_at)} />
          <MetaRow icon="time-outline" text={`${formatTime(event.starts_at)} - ${formatTime(event.ends_at)}`} />
          <MetaRow icon="location-outline" text={event.venue} />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.body}>{event.description || 'No description provided.'}</Text>

          {organizer ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Organiser</Text>
              <TouchableOpacity
                style={styles.orgRow}
                activeOpacity={0.8}
                onPress={() => router.push(`/organizer/${organizer.id}`)}
              >
                <View style={[styles.orgAvatar, { overflow: 'hidden' }]}>
                  {organizer.avatar_path ? (
                    <Image source={{ uri: avatarUrl(organizer.avatar_path) }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={styles.orgInitial}>{organizer.name[0]}</Text>
                  )}
                </View>
                <Text style={styles.orgName}>{organizer.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          ) : null}

          <View style={{ height: space(10) }} />
        </View>
      </ScrollView>

      <SignUpPrompt visible={promptOpen} onClose={() => setPromptOpen(false)} action="save events" />
    </View>
  )
}

function MetaRow({ icon, text }) {
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={19} color={colors.primary} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  )
}

const makeStyles = (colors, radius, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  missing: { padding: space(8), fontSize: 16, color: colors.textMuted },
  backPlain: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2) },
  backText: { fontSize: 17, color: colors.text },
  hero: { height: 300, justifyContent: 'center' },
  heroBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space(4), paddingTop: space(2) },
  circleBtn: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 76, alignSelf: 'center' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -28, paddingHorizontal: space(6), paddingTop: space(6), minHeight: 420 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: space(3), paddingVertical: space(1.5), borderRadius: radius.sm },
  catText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: space(3), marginBottom: space(4) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(3) },
  metaText: { fontSize: 16, color: colors.textMuted, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space(5) },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: space(3) },
  body: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), backgroundColor: colors.inputBg, borderRadius: radius.md, padding: space(4) },
  orgAvatar: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  orgInitial: { fontSize: 19, fontWeight: '800', color: colors.primary },
  orgName: { flex: 1, fontSize: 17, color: colors.text, fontWeight: '600' },
})
