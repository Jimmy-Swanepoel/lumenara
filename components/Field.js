import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/themeProvider'

export default function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  multiline = false,
  icon,
  onPressIcon,
  editable = true,
  style,
}) {
  const { colors, radius, space } = useTheme()
  const Wrapper = onPressIcon ? TouchableOpacity : View

  return (
    <View style={[{ marginBottom: space(4) }, style]}>
      {label ? (
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space(2) }}>
          {label}
        </Text>
      ) : null}
      <Wrapper
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderRadius: radius.md,
            paddingHorizontal: space(4),
            height: 52,
          },
          multiline && { height: 120, alignItems: 'flex-start', paddingVertical: space(3) },
        ]}
        onPress={onPressIcon}
        activeOpacity={onPressIcon ? 0.7 : 1}
      >
        <TextInput
          style={[
            { flex: 1, fontSize: 16, color: colors.text },
            multiline && { textAlignVertical: 'top', height: '100%' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable && !onPressIcon}
          pointerEvents={onPressIcon ? 'none' : 'auto'}
        />
        {icon ? <Ionicons name={icon} size={20} color={colors.textMuted} /> : null}
      </Wrapper>
    </View>
  )
}
