import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useNavigation } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Field from '../../components/Field'
import Button from '../../components/Button'
import PopModal from '../../components/PopModal'
import CalendarPicker from '../../components/CalendarPicker'
import TimePicker from '../../components/TimePicker'
import { useAuth } from '../../lib/auth'
import { EVENT_CATEGORIES, categoryLabel } from '../../lib/theme'
import { useTheme } from '../../lib/themeProvider'
import { toISO } from '../../lib/format'
import { createEvent } from '../../lib/api'
import { supabase } from '../../lib/supabase'

const EMPTY = {
  title: '', venue: '', startDate: '', startTime: '',
  endDate: '', endTime: '', category: 'music', description: '',
}

export default function CreateEvent() {
  const auth = useAuth()
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [form, setForm] = useState(EMPTY)
  const [imageUri, setImageUri] = useState(null)
  const [catOpen, setCatOpen] = useState(false)
  const [datePicker, setDatePicker] = useState(null) // 'start' | 'end' | null
  const [timePicker, setTimePicker] = useState(null) // 'start' | 'end' | null
  const [busy, setBusy] = useState(false)

  const navigation = useNavigation()

  // Reset the form each time the Create tab is focused. Using the
  // navigation focus listener works even when the tab stays mounted.
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setForm(EMPTY)
      setImageUri(null)
    })
    return unsub
  }, [navigation])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const applyStartDefaults = (date, time) => {
    setForm((f) => {
      const next = { ...f, startDate: date ?? f.startDate, startTime: time ?? f.startTime }
      if (!f.endDate && next.startDate) next.endDate = next.startDate
      if (!f.endTime && next.startTime) {
        const [h, m] = next.startTime.split(':').map(Number)
        if (!Number.isNaN(h)) {
          next.endTime = `${String((h + 3) % 24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
        }
      }
      return next
    })
  }

  const displayDate = (iso) => {
    if (!iso) return ''
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const onPickStartDate = (iso) => {
    setForm((f) => ({
      ...f,
      startDate: iso,
      // default end date to start date if not already set or if it's before
      endDate: !f.endDate || f.endDate < iso ? iso : f.endDate,
    }))
  }

  const onPickEndDate = (iso) => {
    setForm((f) => ({ ...f, endDate: iso }))
  }

  const onPickStartTime = (t) => {
    setForm((f) => {
      const next = { ...f, startTime: t }
      if (!f.endTime) {
        const [h, m] = t.split(':').map(Number)
        next.endTime = `${String((h + 3) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        if (!f.endDate && f.startDate) next.endDate = f.startDate
      }
      return next
    })
  }

  const onPickEndTime = (t) => {
    setForm((f) => ({ ...f, endTime: t }))
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add an event image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  const uploadImage = async (uid) => {
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

  const submit = async () => {
    if (!form.title.trim() || !form.venue.trim() || !form.startDate || !form.startTime) {
      Alert.alert('Missing details', 'Please fill in the name, location, date and time.')
      return
    }
    const starts_at = toISO(form.startDate, form.startTime)
    const ends_at = toISO(form.endDate || form.startDate, form.endTime || form.startTime)
    if (new Date(ends_at) <= new Date(starts_at)) {
      Alert.alert('Invalid time', 'The end time must be after the start time.')
      return
    }

    setBusy(true)
    try {
      const image_path = await uploadImage(auth.user.id)
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        venue: form.venue.trim(),
        starts_at,
        ends_at,
        image_path,
      })
      setForm(EMPTY)
      setImageUri(null)
      Alert.alert('Event created', 'Your event is now live.')
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

        <View style={styles.card}>
          <Field label="Event Name" value={form.title} onChangeText={set('title')} placeholder="e.g. Summer Music Festival" autoCapitalize="sentences" />
          <Field label="Location" value={form.venue} onChangeText={set('venue')} placeholder="e.g. Coetzenburg Stadium" autoCapitalize="sentences" />

          <Text style={styles.groupLabel}>Starts</Text>
          <View style={styles.row}>
            <Field value={displayDate(form.startDate)} placeholder="Select date" icon="calendar-outline" onPressIcon={() => setDatePicker('start')} style={styles.half} />
            <Field value={form.startTime} placeholder="Select time" icon="time-outline" onPressIcon={() => setTimePicker('start')} style={styles.half} />
          </View>

          <Text style={styles.groupLabel}>Ends</Text>
          <View style={styles.row}>
            <Field value={displayDate(form.endDate)} placeholder="Select date" icon="calendar-outline" onPressIcon={() => setDatePicker('end')} style={styles.half} />
            <Field value={form.endTime} placeholder="Select time" icon="time-outline" onPressIcon={() => setTimePicker('end')} style={styles.half} />
          </View>

          <Text style={styles.groupLabel}>Category</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setCatOpen(true)} activeOpacity={0.7}>
            <Text style={styles.pickerText}>{categoryLabel(form.category)}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Field label="Description" value={form.description} onChangeText={set('description')} placeholder="Tell people about your event..." autoCapitalize="sentences" multiline style={{ marginTop: space(4) }} />

          <Text style={styles.groupLabel}>Event Picture</Text>
          <TouchableOpacity style={styles.upload} activeOpacity={0.7} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <>
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                <Text style={styles.uploadText}>Tap to upload an image</Text>
                <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
              </>
            )}
          </TouchableOpacity>

          <Button title="Create Event" onPress={submit} loading={busy} style={{ marginTop: space(6) }} />
        </View>

        <View style={{ height: space(10) }} />
      </ScrollView>

      <PopModal visible={catOpen} onClose={() => setCatOpen(false)} title="Category">
        {EVENT_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={styles.catRow}
            onPress={() => { set('category')(c.key); setCatOpen(false) }}
          >
            <Text style={styles.catText}>{c.label}</Text>
            {form.category === c.key ? (
              <Ionicons name="checkmark" size={22} color={colors.primary} />
            ) : null}
          </TouchableOpacity>
        ))}
      </PopModal>

      <CalendarPicker
        visible={datePicker === 'start'}
        onClose={() => setDatePicker(null)}
        selected={form.startDate}
        onSelect={onPickStartDate}
        minDate={new Date().toISOString().slice(0, 10)}
      />
      <CalendarPicker
        visible={datePicker === 'end'}
        onClose={() => setDatePicker(null)}
        selected={form.endDate}
        onSelect={onPickEndDate}
        minDate={form.startDate || new Date().toISOString().slice(0, 10)}
      />
      <TimePicker
        visible={timePicker === 'start'}
        onClose={() => setTimePicker(null)}
        value={form.startTime}
        onSelect={onPickStartTime}
      />
      <TimePicker
        visible={timePicker === 'end'}
        onClose={() => setTimePicker(null)}
        value={form.endTime}
        onSelect={onPickEndTime}
      />
    </SafeAreaView>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, paddingHorizontal: space(6), paddingTop: space(4), paddingBottom: space(5) },
  h1: { fontSize: 27, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: space(1) },
  card: { backgroundColor: colors.card, margin: space(4), borderRadius: radius.lg, padding: space(5), ...shadow },
  groupLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space(2) },
  row: { flexDirection: 'row', gap: space(3) },
  half: { flex: 1 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: space(4), height: 52 },
  pickerText: { fontSize: 16, color: colors.text },
  upload: { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: space(10), alignItems: 'center', backgroundColor: colors.inputBg, overflow: 'hidden' },
  preview: { width: '100%', height: 160, borderRadius: radius.sm },
  uploadText: { fontSize: 16, color: colors.textMuted, marginTop: space(3) },
  uploadHint: { fontSize: 13, color: colors.textMuted, marginTop: space(1) },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space(4), borderBottomWidth: 1, borderBottomColor: colors.border },
  catText: { fontSize: 17, color: colors.text },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(8) },
  blockedTitle: { fontSize: 21, fontWeight: '800', color: colors.text, marginTop: space(4) },
  blockedBody: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: space(2), lineHeight: 23 },
})
