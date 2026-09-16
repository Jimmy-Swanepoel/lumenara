import { useCallback, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import EventForm, { EMPTY_EVENT_FORM } from '../../components/EventForm'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/themeProvider'
import { createEvent } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function CreateEvent() {
  const auth = useAuth()
  const router = useRouter()
  const { colors, space } = useTheme()
  const styles = makeStyles(colors, space)

  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)

  // Re-checks organiser status on every focus so an admin's approval (or a
  // suspension) shows up without the user having to sign out/in.
  useFocusEffect(useCallback(() => { auth.refresh() }, [auth.refresh]))

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

  if (auth.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.blocked}>
          <Ionicons name="time-outline" size={44} color={colors.accent} />
          <Text style={styles.blockedTitle}>Account under review</Text>
          <Text style={styles.blockedBody}>
            You'll be able to create events once an admin approves your
            organiser account.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const submit = async (fields, imageUri) => {
    setBusy(true)
    try {
      const image_path = await uploadImage(auth.user.id, imageUri)
      await createEvent({ ...fields, image_path })
      Alert.alert('Event created', 'Your event is now live.')
      setFormKey((k) => k + 1)
      router.replace('/(tabs)/account')
    } catch (e) {
      Alert.alert('Could not create event', e.message ?? 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.h1}>Create Event</Text>
          <Text style={styles.sub}>Fill in the details for your event listing</Text>
        </View>

        <EventForm key={formKey} initial={EMPTY_EVENT_FORM} submitLabel="Create Event" busy={busy} onSubmit={submit} />

        <View style={{ height: space(10) }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, paddingHorizontal: space(6), paddingTop: space(3), paddingBottom: space(5) },
  h1: { fontSize: 27, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: space(1) },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(8) },
  blockedTitle: { fontSize: 21, fontWeight: '800', color: colors.text, marginTop: space(4) },
  blockedBody: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: space(2), lineHeight: 23 },
})
