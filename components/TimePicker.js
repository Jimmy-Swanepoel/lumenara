import { useRef, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import PopModal from './PopModal'
import Button from './Button'
import { useTheme } from '../lib/themeProvider'

const ROW = 48
const VISIBLE = 5
const PAD = (VISIBLE - 1) / 2

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function Wheel({ values, initial, onChange, colors }) {
  const ref = useRef(null)
  const initialIndex = Math.max(0, values.indexOf(initial))
  const positioned = useRef(false)

  // Position on layout - fires when the ScrollView is actually measured,
  // so the first open lands on the correct value.
  const onLayout = () => {
    if (positioned.current) return
    positioned.current = true
    ref.current?.scrollTo({ y: initialIndex * ROW, animated: false })
  }

  const settle = (y) => {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(y / ROW)))
    onChange(values[i])
    ref.current?.scrollTo({ y: i * ROW, animated: true })
  }

  return (
    <View style={{ height: ROW * VISIBLE, width: 90 }}>
      <ScrollView
        ref={ref}
        onLayout={onLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: ROW * PAD }}
      >
        {values.map((v) => (
          <View key={v} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>
              {String(v).padStart(2, '0')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default function TimePicker({ visible, onClose, value, onSelect }) {
  const { colors, radius, space } = useTheme()

  const [h0, m0] = (value || '18:00').split(':').map(Number)
  const startH = Number.isNaN(h0) ? 18 : h0
  const startM = Number.isNaN(m0) ? 0 : (Math.round(m0 / 5) * 5) % 60

  // Initialise refs to the starting value so an untouched wheel is correct.
  const hourRef = useRef(startH)
  const minRef = useRef(startM)

  // Remount the wheels each time the modal opens so they re-read `value`
  // and reposition cleanly.
  const key = visible ? `${value}-open` : 'closed'

  const confirm = () => {
    const hh = String(hourRef.current).padStart(2, '0')
    const mm = String(minRef.current).padStart(2, '0')
    onSelect(`${hh}:${mm}`)
    onClose()
  }

  return (
    <PopModal visible={visible} onClose={onClose} title="Pick a time">
      <View style={{ position: 'relative', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space(4) }}>
        <View pointerEvents="none" style={{
          position: 'absolute', left: 0, right: 0, top: ROW * PAD, height: ROW,
          backgroundColor: colors.primaryLight, borderRadius: radius.md,
        }} />
        <Wheel key={`h-${key}`} values={HOURS} initial={startH} onChange={(v) => { hourRef.current = v }} colors={colors} />
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>:</Text>
        <Wheel key={`m-${key}`} values={MINUTES} initial={startM} onChange={(v) => { minRef.current = v }} colors={colors} />
      </View>

      <View style={{ marginTop: space(6) }}>
        <Button title="Done" onPress={confirm} />
      </View>
    </PopModal>
  )
}
