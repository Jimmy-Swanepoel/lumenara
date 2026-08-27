import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import EventForm from '../../../components/EventForm'
import { useAuth } from '../../../lib/auth'
import { useTheme } from '../../../lib/themeProvider'
import { splitISO, buildEventChangeMessage } from '../../../lib/format'
import { fetchEventById, updateEventAndNotify, eventImageUrl } from '../../../lib/api'
import { supabase } from '../../../lib/supabase'

export default function EditEvent() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const { colors, space } = useTheme()
  const styles = makeStyles(colors, space)

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const ev = await fetchEventById(id)
      if (ev.organizer_id !== auth.user?.id) {
        router.back()
        return
      }
      setEvent(ev)
    } catch (e) {
      console.log('edit event load error', e)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }, [id, auth.user?.id])

  useEffect(() => { load() }, [load])

  const uploadImage = async (uid, imageUri) => {
    if (!imageUri) return null
    const res = await fetch(imageUri)
    const arrayBuffer = await res.arrayBuffer()
    const path = `${uid}/${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('event-images')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg' })
    if (error) throw error
    return path
  }

  const submit = async (fields, imageUri) => {
    setBusy(true)
    try {
      const image_path = imageUri ? await uploadImage(auth.user.id, imageUri) : event.image_path
      const message = buildEventChangeMessage(event, fields)
      await updateEventAndNotify(id, { ...fields, image_path }, message)
      Alert.alert('Event updated', 'Your changes are live.')
      router.back()
    } catch (e) {
      Alert.alert('Could not update event', e.message ?? 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!event) return null

  const startSplit = splitISO(event.starts_at)
  const endSplit = splitISO(event.ends_at)
  const initial = {
    title: event.title,
    venue: event.venue,
    startDate: startSplit.date,
    startTime: startSplit.time,
    endDate: endSplit.date,
    endTime: endSplit.time,
    category: event.category,
    description: event.description ?? '',
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.h1}>Edit Event</Text>
          <Text style={styles.sub}>Update the details for your event listing</Text>
        </View>

        <EventForm
          initial={initial}
          initialImageUrl={event.image_path ? eventImageUrl(event.image_path) : null}
          submitLabel="Save Changes"
          busy={busy}
          onSubmit={submit}
        />

        <View style={{ height: space(10) }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, paddingHorizontal: space(6), paddingTop: space(2), paddingBottom: space(5) },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: space(3) },
  backText: { fontSize: 17, color: colors.text },
  h1: { fontSize: 27, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: space(1) },
})
