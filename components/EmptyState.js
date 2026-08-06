import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/themeProvider'

export default function EmptyState({ icon = 'bookmark-outline', title, subtitle, children }) {
  const { colors, radius, space, shadow } = useTheme()
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: radius.lg,
      paddingVertical: space(10), paddingHorizontal: space(6),
      alignItems: 'center', ...shadow,
    }}>
      <Ionicons name={icon} size={30} color={colors.textMuted} />
      <Text style={{ fontSize: 16, color: colors.textMuted, marginTop: space(3), textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: space(1.5), textAlign: 'center' }}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: space(5), alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  )
}
