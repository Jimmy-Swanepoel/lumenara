import {
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../lib/themeProvider'

// Centre "pop" modal with a blurred backdrop. Tapping the backdrop
// closes it; the inner card does not close and lets its own
// scrollables receive gestures.
export default function PopModal({ visible, onClose, title, children, scroll = true }) {
  const { colors, radius, space, isDark } = useTheme()

  const Inner = (
    <View style={{
      width: '88%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      paddingHorizontal: space(6),
      paddingVertical: space(6),
    }}>
      {title ? (
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: space(4) }}>
          {title}
        </Text>
      ) : null}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop: only the area OUTSIDE the card closes on tap. */}
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.scrim }]} />
          </BlurView>
        </TouchableWithoutFeedback>
        {/* Card sits above the backdrop and is NOT wrapped in the
            touchable, so gestures inside it (scroll wheels) work. */}
        {Inner}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
