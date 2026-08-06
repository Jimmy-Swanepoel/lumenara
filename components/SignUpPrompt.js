import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import PopModal from './PopModal'
import Button from './Button'
import { useTheme } from '../lib/themeProvider'

export default function SignUpPrompt({ visible, onClose, action = 'save events' }) {
  const router = useRouter()
  const { colors, space } = useTheme()

  const goto = (path) => {
    onClose()
    router.push(path)
  }

  return (
    <PopModal visible={visible} onClose={onClose} title="Create an account">
      <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 23, marginBottom: space(6) }}>
        Sign up to {action}, follow organisers, and get personalised recommendations.
      </Text>
      <View style={{ gap: space(3) }}>
        <Button title="Sign Up" onPress={() => goto('/auth/role-select')} />
        <Button title="Log In" variant="outline" onPress={() => goto('/auth/login')} />
        <Button title="Not now" variant="ghost" onPress={onClose} />
      </View>
    </PopModal>
  )
}
