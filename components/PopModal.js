import { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  Animated,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/themeProvider'

// Centre "pop" modal with a blurred backdrop. Tapping the backdrop
// closes it; the inner card does not close and lets its own
// scrollables receive gestures. Uses animationType="none" + a driven
// scale/opacity so the card pops in from the centre instead of relying
// on Android's native fade transition (which can visibly jump/settle).
// `dismissable=false` disables the backdrop-tap close (for popups the user
// must explicitly act on); `closeButton=true` adds an X top-right.
export default function PopModal({
  visible, onClose, title, children, scroll = true, dismissable = true, closeButton = false,
}) {
  const { colors, radius, space, isDark } = useTheme()
  const scale = useRef(new Animated.Value(0.85)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85)
      opacity.setValue(0)
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  const Inner = (
    <Animated.View style={{
      width: '88%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      paddingHorizontal: space(6),
      paddingVertical: space(6),
      opacity,
      transform: [{ scale }],
    }}>
      {title || closeButton ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space(4) }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, flex: 1 }}>
            {title}
          </Text>
          {closeButton ? (
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: space(3) }}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </Animated.View>
  )

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop: only the area OUTSIDE the card closes on tap. */}
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={dismissable ? onClose : () => {}}>
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
