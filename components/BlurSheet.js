import {
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../lib/themeProvider'

// Bottom sheet with a blurred backdrop. Used for scrollable forms
// (edit profile). Quick pickers use PopModal instead.
export default function BlurSheet({ visible, onClose, title, children }) {
  const { colors, radius, space, isDark } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.scrim }]} />
          </BlurView>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: space(3),
            paddingHorizontal: space(6),
            paddingBottom: space(8),
            maxHeight: '85%',
          }}>
            <View style={{
              alignSelf: 'center', width: 44, height: 5, borderRadius: radius.pill,
              backgroundColor: colors.border, marginBottom: space(4),
            }} />
            {title ? (
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space(5) }}>
                {title}
              </Text>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space(4) }}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end' },
})
