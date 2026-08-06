import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import Button from '../../components/Button'
import Field from '../../components/Field'
import BlurSheet from '../../components/BlurSheet'
import EmptyState from '../../components/EmptyState'
import EventCard from '../../components/EventCard'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'
import { isPast } from '../../lib/format'
import {
  fetchSavedEvents,
  fetchFollowingIds,
  fetchEventsByOrganizer,
  updateMyOrganizer,
  avatarUrl,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function Account() {
  const auth = useAuth()

  if (auth.loading) return <Loading />
  if (auth.isGuest) return <GuestAccount />
  if (auth.isOrganizer) return <OrganizerAccount />
  if (auth.isAdmin) return <AdminAccount />
  return <UserAccount />
}

function Loading() {
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  return (
    <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </SafeAreaView>
  )
}

function GuestAccount() {
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.guestWrap}>
        <View style={styles.avatarLg}>
          <Ionicons name="person-outline" size={44} color={colors.primary} />
        </View>
        <Text style={styles.welcome}>Welcome to Lumenara</Text>
        <Text style={styles.welcomeSub}>
          Create an account to save events, follow organisers, and get
          personalised recommendations.
        </Text>
        <View style={{ alignSelf: 'stretch', gap: space(3), marginTop: space(6) }}>
          <Button title="Sign Up" onPress={() => router.push('/auth/role-select')} />
          <Button title="Log In" variant="outline" onPress={() => router.push('/auth/login')} />
        </View>
      </View>
    </SafeAreaView>
  )
}

function UserAccount() {
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  const [editOpen, setEditOpen] = useState(false)
  const [draftName, setDraftName] = useState(auth.profile?.display_name ?? '')
  const [saved, setSaved] = useState([])
  const [followCount, setFollowCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([fetchSavedEvents(), fetchFollowingIds()])
      setSaved(s)
      setFollowCount(f.length)
    } catch (e) {
      console.log('user account load error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const saveName = async () => {
    await supabase.from('profiles').update({ display_name: draftName }).eq('id', auth.user.id)
    await auth.refresh()
    setEditOpen(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarSm}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{auth.profile?.display_name ?? 'User'}</Text>
            <Text style={styles.role}>User Account</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditOpen(true)}>
            <Ionicons name="create-outline" size={17} color={colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statNum}>{followCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>

        <Text style={styles.sectionTitle}>Saved Events</Text>
        <View style={{ paddingHorizontal: space(4) }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: space(6) }} />
          ) : saved.length === 0 ? (
            <EmptyState title="No saved events yet" subtitle="Tap the bookmark icon on any event to save it" />
          ) : (
            saved.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>

        <View style={{ height: space(8) }} />
      </ScrollView>

      <BlurSheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <Field label="Username" value={draftName} onChangeText={setDraftName} />
        <Button title="Save Changes" onPress={saveName} />
      </BlurSheet>
    </SafeAreaView>
  )
}

function OrganizerAccount() {
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [draft, setDraft] = useState({
    name: auth.organizer?.name ?? '',
    bio: auth.organizer?.bio ?? '',
    avatar_path: auth.organizer?.avatar_path ?? null,
    instagram_url: auth.organizer?.instagram_url ?? '',
    facebook_url: auth.organizer?.facebook_url ?? '',
    x_url: auth.organizer?.x_url ?? '',
    tiktok_url: auth.organizer?.tiktok_url ?? '',
  })
  const [pickedAvatar, setPickedAvatar] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const load = useCallback(async () => {
    if (!auth.isApprovedOrganizer) { setLoading(false); return }
    setLoading(true)
    try {
      const ev = await fetchEventsByOrganizer(auth.user.id)
      setEvents(ev)
    } catch (e) {
      console.log('organizer load error', e)
    } finally {
      setLoading(false)
    }
  }, [auth.isApprovedOrganizer, auth.user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const upcoming = events.filter((e) => !isPast(e.ends_at))
  const past = events.filter((e) => isPast(e.ends_at))
  const shown = tab === 'upcoming' ? upcoming : past

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to change your picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    setPickedAvatar(uri)
    setUploadingAvatar(true)
    try {
      const res = await fetch(uri)
      const arrayBuffer = await res.arrayBuffer()
      const path = `${auth.user.id}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error
      setDraft((d) => ({ ...d, avatar_path: path }))
    } catch (e) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload the image.')
      setPickedAvatar(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    await updateMyOrganizer(draft)
    await auth.refresh()
    setEditOpen(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarSm, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="megaphone-outline" size={26} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{auth.organizer?.name ?? 'Organiser'}</Text>
            <Text style={styles.role}>Organiser Account</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditOpen(true)}>
            <Ionicons name="create-outline" size={17} color={colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {auth.isPending ? (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={20} color="#92400E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Account under review</Text>
              <Text style={styles.pendingBody}>
                We're checking your details. You'll be able to create events once an admin approves your account.
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Your Events</Text>

        {auth.isApprovedOrganizer ? (
          <View style={styles.segment}>
            <TouchableOpacity style={[styles.segBtn, tab === 'upcoming' && styles.segActive]} onPress={() => setTab('upcoming')}>
              <Text style={[styles.segText, tab === 'upcoming' && styles.segTextActive]}>Upcoming ({upcoming.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segBtn, tab === 'past' && styles.segActive]} onPress={() => setTab('past')}>
              <Text style={[styles.segText, tab === 'past' && styles.segTextActive]}>Past ({past.length})</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: space(4) }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: space(6) }} />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={auth.isPending ? 'Event creation unlocks after approval' : 'No events created yet'}
            >
              {auth.isApprovedOrganizer ? (
                <Button title="Create Your First Event" onPress={() => router.push('/create')} />
              ) : null}
            </EmptyState>
          ) : (
            shown.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>

        <View style={{ height: space(8) }} />
      </ScrollView>

      <BlurSheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <View style={styles.photoWrap}>
          <View style={[styles.avatarLg, { backgroundColor: colors.accentLight, overflow: 'hidden' }]}>
            {pickedAvatar || draft.avatar_path ? (
              <Image
                source={{ uri: pickedAvatar || avatarUrl(draft.avatar_path) }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Ionicons name="megaphone-outline" size={38} color={colors.accent} />
            )}
          </View>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
            <Text style={styles.changePhoto}>
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        <Field label="Organisation Name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} autoCapitalize="words" />
        <Field label="Description" value={draft.bio} onChangeText={(v) => setDraft({ ...draft, bio: v })} placeholder="Tell people about your organisation..." multiline />
        <Text style={styles.socialLabel}>Social Links</Text>
        <SocialRow icon="logo-instagram" color="#E1306C" placeholder="https://instagram.com/yourname" value={draft.instagram_url} onChangeText={(v) => setDraft({ ...draft, instagram_url: v })} />
        <SocialRow icon="logo-facebook" color="#1877F2" placeholder="https://facebook.com/yourname" value={draft.facebook_url} onChangeText={(v) => setDraft({ ...draft, facebook_url: v })} />
        <SocialRow icon="logo-twitter" color="#111827" placeholder="https://x.com/yourname" value={draft.x_url} onChangeText={(v) => setDraft({ ...draft, x_url: v })} />
        <SocialRow icon="logo-tiktok" color="#111827" placeholder="https://tiktok.com/@yourname" value={draft.tiktok_url} onChangeText={(v) => setDraft({ ...draft, tiktok_url: v })} />
        <Button title="Save Changes" style={{ marginTop: space(4) }} onPress={saveProfile} />
      </BlurSheet>
    </SafeAreaView>
  )
}

function SocialRow({ icon, color, placeholder, value, onChangeText }) {
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  return (
    <View style={styles.socialRow}>
      <View style={[styles.socialBadge, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Field value={value} onChangeText={onChangeText} placeholder={placeholder} style={{ flex: 1, marginBottom: 0 }} />
    </View>
  )
}

function AdminAccount() {
  const auth = useAuth()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)
  const router = useRouter()
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarSm, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Admin</Text>
            <Text style={styles.role}>Administrator</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={{ paddingHorizontal: space(4), gap: space(3) }}>
          <Button title="Organiser Approvals" onPress={() => router.push('/admin/approvals')} />
          <Button title="Sign Out" variant="outline" onPress={auth.signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(6) },
  welcome: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: space(5) },
  welcomeSub: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: space(3), lineHeight: 23 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: space(3), backgroundColor: colors.card, paddingHorizontal: space(4), paddingVertical: space(4) },
  avatarSm: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarLg: { width: 92, height: 92, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 21, fontWeight: '800', color: colors.text },
  role: { fontSize: 15, color: colors.textMuted, marginTop: space(0.5) },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), backgroundColor: colors.inputBg, paddingHorizontal: space(3.5), paddingVertical: space(2.5), borderRadius: radius.md },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  statsRow: { backgroundColor: colors.card, paddingHorizontal: space(4), paddingBottom: space(4) },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 14, color: colors.textMuted },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, paddingHorizontal: space(4), marginTop: space(5), marginBottom: space(3) },
  pendingBanner: { flexDirection: 'row', gap: space(3), backgroundColor: '#FEF3C7', marginHorizontal: space(4), marginTop: space(4), padding: space(4), borderRadius: radius.md },
  pendingTitle: { fontWeight: '700', color: '#92400E', fontSize: 15 },
  pendingBody: { color: '#92400E', fontSize: 14, marginTop: space(1), lineHeight: 19 },
  segment: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(4), marginBottom: space(4) },
  segBtn: { flex: 1, paddingVertical: space(3), borderRadius: radius.md, backgroundColor: colors.inputBg, alignItems: 'center' },
  segActive: { backgroundColor: colors.primary },
  segText: { fontWeight: '700', color: colors.text, fontSize: 15 },
  segTextActive: { color: '#fff' },
  photoWrap: { alignItems: 'center', gap: space(2), marginBottom: space(6) },
  changePhoto: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  socialLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space(3) },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(3) },
  socialBadge: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  socialBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
