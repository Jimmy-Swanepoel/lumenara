import { useRef, useCallback } from 'react'
import { Animated, Dimensions } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { useRouter, useFocusEffect } from 'expo-router'
import { useIsFocused } from '@react-navigation/native'
import { useAuth } from '../lib/auth'

const BASE_TAB_ORDER = [
  { name: 'index', path: '/' },
  { name: 'account', path: '/account' },
  { name: 'more', path: '/more' },
]

// Organisers get Create spliced in after Account, matching its position in
// the bottom tab bar, so swiping from Account lands on it instead of
// skipping straight to More.
const ORGANIZER_TAB_ORDER = [
  { name: 'index', path: '/' },
  { name: 'account', path: '/account' },
  { name: 'create', path: '/create' },
  { name: 'more', path: '/more' },
]

const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 600
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Module-level, not state: React Navigation keeps tab screens mounted across
// switches, so each screen's own state can't tell which tab was previously
// focused. This is shared across all three screens purely to pick a slide
// direction on focus - it's not used for anything else.
let previousIndex = null

// Also module-level and shared across all three screens' handlers, as extra
// hardening against a gesture bleeding into the newly-focused screen's own
// handler (React Navigation keeps every tab screen mounted). Locking the
// moment ANY gesture BEGINs, not just after one completes, means a second
// BEGAN arriving mid-drag or shortly after is ignored outright.
let swipeBusy = false
let unlockTimer = null

function markBusy() {
  swipeBusy = true
  clearTimeout(unlockTimer)
  // Safety net only - a real terminal state always clears this sooner.
  unlockTimer = setTimeout(() => { swipeBusy = false }, 3000)
}

function releaseBusySoon() {
  clearTimeout(unlockTimer)
  unlockTimer = setTimeout(() => { swipeBusy = false }, 400)
}

// Wraps a tab screen so a confident horizontal swipe switches to the
// neighbouring tab. activeOffsetX/failOffsetY let vertical scrolling and
// nested horizontal scrollers (category chips) win by default - this gesture
// only takes over once the drag is clearly horizontal and past a threshold.
// Uses the classic (non-worklet) gesture-handler API on purpose: reanimated's
// worklets native module fails to register under this project's Expo Go
// client, so onHandlerStateChange (a plain JS-thread callback) sidesteps it.
// `enabled={isFocused}` means only the currently-visible screen's handler can
// ever receive gesture events at all - the other two, though still mounted,
// are fully inert.
//
// Note: a swipe starting very close to the screen's left/right edge can be
// intercepted by Android's system back gesture before this handler ever sees
// it - that's OS-level edge-gesture navigation, not something fixable here.
//
// React Navigation's bottom-tabs never animates between tabs on its own -
// switching just swaps the screen instantly. To make it feel like a real
// swipe (not just a jump-cut), the newly-focused screen slides + fades in
// from the direction it logically came from, using RN's core Animated API
// (also reanimated-free) driven off useFocusEffect.
export default function SwipeTabWrapper({ name, children }) {
  const router = useRouter()
  const { isOrganizer } = useAuth()
  const isFocused = useIsFocused()
  const TAB_ORDER = isOrganizer ? ORGANIZER_TAB_ORDER : BASE_TAB_ORDER
  const index = TAB_ORDER.findIndex((t) => t.name === name)
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  useFocusEffect(
    useCallback(() => {
      let from = 0
      if (previousIndex !== null && previousIndex !== index) {
        from = index > previousIndex ? SCREEN_WIDTH * 0.4 : -SCREEN_WIDTH * 0.4
      }
      previousIndex = index

      if (from !== 0) {
        translateX.setValue(from)
        opacity.setValue(0.5)
        Animated.parallel([
          Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start()
      }
    }, [index, translateX, opacity])
  )

  const goTo = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= TAB_ORDER.length) return
    router.navigate(TAB_ORDER[targetIndex].path)
  }

  const onHandlerStateChange = ({ nativeEvent }) => {
    const { state, oldState } = nativeEvent

    if (state === State.BEGAN) {
      if (swipeBusy) return
      markBusy()
      return
    }

    const isTerminal = state === State.END || state === State.CANCELLED || state === State.FAILED
    if (!isTerminal) return

    if (state === State.END && oldState === State.ACTIVE) {
      const { translationX, velocityX } = nativeEvent
      const swipedLeft = translationX < -SWIPE_DISTANCE || velocityX < -SWIPE_VELOCITY
      const swipedRight = translationX > SWIPE_DISTANCE || velocityX > SWIPE_VELOCITY
      if (swipedLeft) goTo(index + 1)
      else if (swipedRight) goTo(index - 1)
    }

    releaseBusySoon()
  }

  return (
    <PanGestureHandler
      enabled={isFocused}
      activeOffsetX={[-24, 24]}
      failOffsetY={[-16, 16]}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={{ flex: 1, transform: [{ translateX }], opacity }}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  )
}
