import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Field from './Field'
import Button from './Button'
import PopModal from './PopModal'
import CalendarPicker from './CalendarPicker'
import TimePicker from './TimePicker'
import { EVENT_CATEGORIES, categoryLabel } from '../lib/theme'
import { useTheme } from '../lib/themeProvider'
import { toISO } from '../lib/format'

export const EMPTY_EVENT_FORM = {
  title: '', venue: '', startDate: '', startTime: '',
  endDate: '', endTime: '', category: 'music', description: '',
}

// Shared by Create Event and Edit Event. `initial` is a form-shaped object
// (see EMPTY_EVENT_FORM); `initialImageUrl` is the current image's remote
// URL to preview (edit only) until the user picks a replacement.
// onSubmit(fields, pickedImageUri) is called after validation - fields are
// ready for the events table (starts_at/ends_at as ISO); pickedImageUri is
// the new local image to upload, or null if the image wasn't changed.
export default function EventForm({ initial, initialImageUrl = null, submitLabel, busy, onSubmit }) {
  const { colors, radius, space, shadow } = useTheme()
  const styles = makeStyles(colors, radius, space, shadow)

  const [form, setForm] = useState(initial ?? EMPTY_EVENT_FORM)
  const [imageUri, setImageUri] = useState(null)
  const [catOpen, setCatOpen] = useState(false)
  const [datePicker, setDatePicker] = useState(null) // 'start' | 'end' | null
  const [timePicker, setTimePicker] = useState(null) // 'start' | 'end' | null

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

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

  const nextDay = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + 1)
    return dt.toISOString().slice(0, 10)
  }

  const onPickEndTime = (t) => {
    setForm((f) => ({ ...f, endTime: t }))
  }

  // The effective end date, computed live: if the user hasn't picked an
  // explicit end date, and the end time is at or before the start time,
  // the event ends the NEXT day. Derived every render so it never desyncs.
  const effectiveEndDate = (() => {
    if (!form.startDate) return form.endDate || ''
    if (form.endDate && form.endDate > form.startDate) return form.endDate
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      return nextDay(form.startDate)
    }
    return form.startDate
  })()

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

  const submit = () => {
    if (!form.title.trim() || !form.venue.trim() || !form.startDate || !form.startTime) {
      Alert.alert('Missing details', 'Please fill in the name, location, date and time.')
      return
    }
    const starts_at = toISO(form.startDate, form.startTime)
    const endTime = form.endTime || form.startTime
    const ends_at = toISO(effectiveEndDate, endTime)

    if (new Date(ends_at) <= new Date(starts_at)) {
      Alert.alert('Invalid time', 'The end must be after the start.')
      return
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      venue: form.venue.trim(),
      starts_at,
      ends_at,
    }, imageUri)
  }

  return (
    <>
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
          <Field value={displayDate(effectiveEndDate)} placeholder="Select date" icon="calendar-outline" onPressIcon={() => setDatePicker('end')} style={styles.half} />
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
          {imageUri || initialImageUrl ? (
            <Image source={{ uri: imageUri || initialImageUrl }} style={styles.preview} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload an image</Text>
              <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
            </>
          )}
        </TouchableOpacity>

        <Button title={submitLabel} onPress={submit} loading={busy} style={{ marginTop: space(6) }} />
      </View>

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
    </>
  )
}

const makeStyles = (colors, radius, space, shadow) => StyleSheet.create({
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
})
