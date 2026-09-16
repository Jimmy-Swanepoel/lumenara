import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../lib/themeProvider'
import { categoryLabel, categoryStyle } from '../lib/theme'
import { formatCardDateTime } from '../lib/format'
import { eventImageUrl } from '../lib/api'

export default function EventCard({ event }) {
  const router = useRouter()
  const { colors, radius, space, shadow } = useTheme()
  const cat = categoryStyle(event.category)
  const imgUrl = event.image_path ? eventImageUrl(event.image_path) : null

  return (
    <TouchableOpacity
      style={{ backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', marginBottom: space(4), ...shadow }}
      activeOpacity={0.85}
      onPress={() => router.push(`/event/${event.id}`)}
    >
      <View style={{ height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: cat.bg }}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: 56 }}>{cat.emoji}</Text>
        )}
        <View style={{
          position: 'absolute', top: space(3), right: space(3),
          backgroundColor: 'rgba(255,255,255,0.92)',
          paddingHorizontal: space(3), paddingVertical: space(1.5), borderRadius: radius.pill,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
            {categoryLabel(event.category)}
          </Text>
        </View>
      </View>

      <View style={{ padding: space(4) }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{event.title}</Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: space(1.5) }}>
          {formatCardDateTime(event.starts_at)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
