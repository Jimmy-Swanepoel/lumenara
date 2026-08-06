import { ScrollView, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../lib/themeProvider'
import { CATEGORIES } from '../lib/theme'

export default function CategoryChips({ selected, onSelect }) {
  const { colors, radius, space } = useTheme()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space(4), gap: space(2.5), paddingVertical: space(1) }}
    >
      {CATEGORIES.map((c) => {
        const active = c.key === selected
        return (
          <TouchableOpacity
            key={c.key}
            onPress={() => onSelect(c.key)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: space(5), paddingVertical: space(2.5), borderRadius: radius.pill,
              backgroundColor: active ? colors.primary : colors.chipBg,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: active ? '#fff' : colors.text }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}
