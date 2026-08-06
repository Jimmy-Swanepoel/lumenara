import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../lib/themeProvider'
import { categoryStyle } from '../lib/theme'
import { formatShortDate } from '../lib/format'
import { eventImageUrl } from '../lib/api'

const AUTO_MS = 5000
const PAUSE_MS = 10000

export default function FeaturedCarousel({ events }) {
  const router = useRouter()
  const { radius, space, shadow } = useTheme()
  const [index, setIndex] = useState(0)
  const [pausedUntil, setPausedUntil] = useState(0)
  const timer = useRef(null)

  const count = events.length

  useEffect(() => {
    if (count <= 1) return
    timer.current = setInterval(() => {
      if (Date.now() < pausedUntil) return
      setIndex((i) => (i + 1) % count)
    }, AUTO_MS)
    return () => clearInterval(timer.current)
  }, [count, pausedUntil])

  const go = (dir) => {
    setIndex((i) => (i + dir + count) % count)
    setPausedUntil(Date.now() + PAUSE_MS)
  }

  if (count === 0) return null

  const event = events[index]
  const cat = categoryStyle(event.category)
  const imgUrl = event.image_path ? eventImageUrl(event.image_path) : null

  return (
    <View style={{ paddingHorizontal: space(4), marginBottom: space(6) }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/event/${event.id}`)}
        style={{ height: 200, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'center', backgroundColor: cat.bg, ...shadow }}
      >
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} />
        ) : (
          <Text style={styles.emoji}>{cat.emoji}</Text>
        )}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />

        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>FEATURED</Text>
        </View>

        {count > 1 && (
          <>
            <TouchableOpacity style={[styles.arrow, { left: space(3) }]} onPress={() => go(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.arrow, { right: space(3) }]} onPress={() => go(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        <View style={{ position: 'absolute', left: space(4), bottom: space(8), right: space(4) }}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.sub}>{formatShortDate(event.starts_at)} {'\u00B7'} {event.venue}</Text>
        </View>

        <View style={styles.dots}>
          {events.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  emoji: { fontSize: 64, alignSelf: 'flex-end', marginRight: 24, opacity: 0.9 },
  featuredBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  featuredText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  arrow: { position: 'absolute', top: '45%', width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 20, backgroundColor: '#fff' },
})
