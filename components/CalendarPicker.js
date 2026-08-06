import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PopModal from './PopModal'
import Button from './Button'
import { useTheme } from '../lib/themeProvider'

// Reusable month calendar in a pop modal. Same look as the Home
// date filter. Used by the create-event date fields.
export default function CalendarPicker({ visible, onClose, selected, onSelect, minDate }) {
  const { colors, radius, space } = useTheme()

  const [cursor, setCursor] = useState(() => {
    const base = selected ? new Date(selected) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthName = cursor.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length < 42) cells.push(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const iso = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const cal = {
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(5) },
    navBtn: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
    month: { fontSize: 19, fontWeight: '800', color: colors.text },
    weekRow: { flexDirection: 'row', marginBottom: space(2) },
    weekday: { flex: 1, textAlign: 'center', fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
    dayWrap: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    today: { backgroundColor: colors.primaryLight },
    selected: { backgroundColor: colors.primary },
    disabled: { opacity: 0.3 },
    day: { fontSize: 16, color: colors.text },
    todayText: { color: colors.primary, fontWeight: '700' },
    selectedText: { color: '#fff', fontWeight: '700' },
  }

  return (
    <PopModal visible={visible} onClose={onClose} title="Pick a date">
      <View style={cal.header}>
        <TouchableOpacity style={cal.navBtn} onPress={() => setCursor(new Date(year, month - 1, 1))}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={cal.month}>{monthName}</Text>
        <TouchableOpacity style={cal.navBtn} onPress={() => setCursor(new Date(year, month + 1, 1))}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={cal.weekRow}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <Text key={d} style={cal.weekday}>{d}</Text>
        ))}
      </View>

      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`x${i}`} style={cal.cell} />
          const dayIso = iso(day)
          const isToday = dayIso === todayStr
          const isSelected = dayIso === selected
          const isDisabled = minDate && dayIso < minDate
          return (
            <TouchableOpacity
              key={`d${i}`}
              style={cal.cell}
              disabled={isDisabled}
              onPress={() => { onSelect(dayIso); onClose() }}
            >
              <View style={[cal.dayWrap, isToday && cal.today, isSelected && cal.selected, isDisabled && cal.disabled]}>
                <Text style={[cal.day, isToday && cal.todayText, isSelected && cal.selectedText]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </PopModal>
  )
}
