import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../lib/themeProvider'

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const { colors, radius, space } = useTheme()
  const isPrimary = variant === 'primary'
  const isOutline = variant === 'outline'
  const isDanger = variant === 'danger'
  const isGhost = variant === 'ghost'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          height: 52,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space(5),
        },
        isPrimary && { backgroundColor: colors.primary },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
        isGhost && { backgroundColor: colors.primaryLight },
        isDanger && { backgroundColor: colors.danger },
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isDanger ? '#fff' : colors.primary} />
      ) : (
        <Text
          style={[
            { fontSize: 16, fontWeight: '700' },
            (isPrimary || isDanger) && { color: '#fff' },
            (isOutline || isGhost) && { color: colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}
