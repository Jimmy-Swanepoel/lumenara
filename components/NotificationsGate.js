import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import PopModal from './PopModal'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/themeProvider'
import { fetchMyNotifications, markNotificationsRead } from '../lib/api'

// App-wide unavoidable popup for "an event you saved changed". Checked on
// launch (once auth is ready) and whenever the app returns to the
// foreground. Not dismissable by tapping the backdrop - only the X, which
// marks everything shown as read. Tapping an edited event's row jumps to
// its page; deleted events aren't tappable (nothing left to open).
export default function NotificationsGate() {
  const auth = useAuth()
  const router = useRouter()
  const { colors, radius, space } = useTheme()
  const styles = makeStyles(colors, radius, space)

  const [items, setItems] = useState([])
  const [visible, setVisible] = useState(false)
  const appState = useRef(AppState.currentState)

  const check = useCallback(async () => {
    if (auth.isGuest) return
    try {
      const unread = await fetchMyNotifications()
      if (unread.length > 0) {
        setItems(unread)
        setVisible(true)
      }
    } catch (e) {
      console.log('notifications check error', e)
    }
  }, [auth.isGuest])

  useEffect(() => {
    if (!auth.loading) check()
  }, [auth.loading, auth.user?.id, check])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        check()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [check])

  const dismissAll = async () => {
    const ids = items.map((n) => n.id)
    setVisible(false)
    setItems([])
    try {
      await markNotificationsRead(ids)
    } catch (e) {
      console.log('mark notifications read error', e)
    }
  }

  const openEvent = async (n) => {
    setVisible(false)
    setItems((prev) => prev.filter((x) => x.id !== n.id))
    try {
      await markNotificationsRead([n.id])
    } catch (e) {
      console.log('mark notification read error', e)
    }
    if (n.event_id) router.push(`/event/${n.event_id}`)
  }

  return (
    <PopModal
      visible={visible}
      onClose={dismissAll}
      dismissable={false}
      closeButton
      title="Updates to events you saved"
    >
      {items.map((n) => {
        const tappable = n.type === 'edited' && n.event_id
        const Row = tappable ? TouchableOpacity : View
        return (
          <Row key={n.id} style={styles.row} onPress={tappable ? () => openEvent(n) : undefined}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{n.event_title}</Text>
              <Text style={styles.message}>{n.message}</Text>
            </View>
            {tappable ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
          </Row>
        )
      })}
    </PopModal>
  )
}

const makeStyles = (colors, radius, space) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space(2),
    paddingVertical: space(3), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  message: { fontSize: 14, color: colors.textMuted, marginTop: space(0.5), lineHeight: 19 },
})
