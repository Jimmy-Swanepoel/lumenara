import { ScrollView, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../lib/themeProvider'
import { CATEGORIES, CATEGORY_GRADIENT } from '../lib/theme'

// Resting state is an outline (gradient ring, card colour showing through);
// the active filter fills solid with the same gradient - so selection state
// reads at a glance without a second visual language on top of colour.
//
// Both the ring and the inner fill are always LinearGradient nodes at a
// fixed size - only their `colors` prop changes between active/inactive.
// Toggling padding/size (or swapping a View for a LinearGradient) between
// states made the native gradient view flash black for a frame on Android
// while it resized/remounted; keeping geometry identical and only changing
// colour values avoids that entirely.
const OUTLINE_WIDTH = 2

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
        const gradient = CATEGORY_GRADIENT[c.key] ?? [colors.primary, colors.primary]
        return (
          <TouchableOpacity key={c.key} onPress={() => onSelect(c.key)} activeOpacity={0.8}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: radius.pill, padding: OUTLINE_WIDTH }}
            >
              <LinearGradient
                colors={active ? gradient : [colors.card, colors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: radius.pill,
                  paddingHorizontal: space(5) - OUTLINE_WIDTH,
                  paddingVertical: space(2.5) - OUTLINE_WIDTH,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: active ? '#fff' : colors.text }}>
                  {c.label}
                </Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}
