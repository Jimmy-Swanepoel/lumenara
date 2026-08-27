import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import FeaturedCarousel from '../../components/FeaturedCarousel'
import CategoryChips from '../../components/CategoryChips'
import EventCard from '../../components/EventCard'
import EmptyState from '../../components/EmptyState'
import PopModal from '../../components/PopModal'
import Button from '../../components/Button'
import { useTheme } from '../../lib/themeProvider'
import { formatLongDate, toDateKey } from '../../lib/format'
import { fetchUpcomingEvents, fetchFeaturedEvents } from '../../lib/api'

export default function Home() {
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [events, setEvents] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [ev, feat] = await Promise.all([
        fetchUpcomingEvents(),
        fetchFeaturedEvents(),
      ])
      setEvents(ev)
      setFeatured(feat)
    } catch (e) {
      console.log('home load error', e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = events.filter((e) => {
    if (category !== 'all' && e.category !== category) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const inTitle = e.title?.toLowerCase().includes(q)
      const inOrg = e.organizer_name?.toLowerCase().includes(q)
      if (!inTitle && !inOrg) return false
    }
    if (dateFilter) {
      if (toDateKey(e.starts_at) !== dateFilter) return false
    }
    return true
  })

  const showCarousel =
    category === 'all' && !query && !dateFilter && featured.length > 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Lumenara</Text>
          <Text style={styles.tagline}>Stellenbosch Events</Text>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity onPress={() => setCalendarOpen(true)}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={dateFilter ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {dateFilter ? (
          <TouchableOpacity style={styles.activeFilter} onPress={() => setDateFilter(null)}>
            <Text style={styles.activeFilterText}>{formatLongDate(dateFilter)}</Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.chipsWrap}>
          <CategoryChips selected={category} onSelect={setCategory} />
        </View>

        {showCarousel ? <FeaturedCarousel events={featured} /> : null}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <Text style={styles.count}>
            {filtered.length} event{filtered.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: space(8) }} />
          ) : loadError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Couldn't load events"
              subtitle="Check your connection and try again"
            >
              <Button title="Try again" variant="outline" onPress={load} />
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events found"
              subtitle={
                events.length === 0
                  ? 'No events have been posted yet'
                  : 'Try a different category or clear your filters'
              }
            />
          ) : (
            filtered.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>

        <View style={{ height: space(8) }} />
      </ScrollView>

      <CalendarSheet
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selected={dateFilter}
        onSelect={(d) => {
          setDateFilter(d)
          setCalendarOpen(false)
        }}
      />
    </SafeAreaView>
  )
}

function CalendarSheet({ visible, onClose, selected, onSelect }) {
  const { colors, radius, space } = useTheme()
  const cal = makeCal(colors, radius, space)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthName = cursor.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  // Pad to a fixed 42 cells (6 rows) so the grid height never changes
  // and the nav arrows stay in the same place month to month.
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length < 42) cells.push(null)

  const todayStr = toDateKey(new Date().toISOString())
  const iso = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

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
          return (
            <TouchableOpacity key={`d${i}`} style={cal.cell} onPress={() => onSelect(dayIso)}>
              <View style={[cal.dayWrap, isToday && cal.today, isSelected && cal.selected]}>
                <Text style={[cal.day, isToday && cal.todayText, isSelected && cal.selectedText]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={{ marginTop: space(4) }}>
        <Button title="Clear date filter" variant="ghost" onPress={() => onSelect(null)} />
      </View>
    </PopModal>
  )
}

const makeStyles = (colors, radius, space) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingTop: space(3), paddingBottom: space(4) },
  brand: { fontSize: 26, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 15, color: colors.textMuted, marginTop: space(0.5) },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    marginHorizontal: space(4),
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: space(4),
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    alignSelf: 'flex-start',
    marginHorizontal: space(4),
    marginTop: space(3),
    backgroundColor: colors.primaryLight,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: radius.pill,
  },
  activeFilterText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  chipsWrap: { marginTop: space(4), marginBottom: space(5) },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    marginBottom: space(3),
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  count: { fontSize: 14, color: colors.textMuted },
  list: { paddingHorizontal: space(4) },
})

const makeCal = (colors, radius, space) => StyleSheet.create({
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
  day: { fontSize: 16, color: colors.text },
  todayText: { color: colors.primary, fontWeight: '700' },
  selectedText: { color: '#fff', fontWeight: '700' },
})
