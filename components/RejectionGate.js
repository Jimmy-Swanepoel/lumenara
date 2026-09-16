import { useEffect, useRef, useState } from 'react'
import { Text, AppState } from 'react-native'
import PopModal from './PopModal'
import Button from './Button'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/themeProvider'
import { deleteRejectedOrganizerAccount } from '../lib/api'

// Shown when an organiser application has been rejected. Checked on launch
// and on foreground-return (same AppState pattern as NotificationsGate), by
// watching auth.organizerStatus rather than polling separately. Undismissable
// except via the button, which fully wipes the account (see
// deleteRejectedOrganizerAccount / the reject-cleanup Edge Function) and
// signs the person out - landing them back as a true guest, not lingering as
// a demoted 'user' account.
export default function RejectionGate() {
  const auth = useAuth()
  const { colors, space } = useTheme()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    if (!auth.loading && auth.organizerStatus === 'rejected') setVisible(true)
  }, [auth.loading, auth.organizerStatus])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        auth.refresh()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [auth.refresh])

  const acknowledge = async () => {
    setBusy(true)
    try {
      await deleteRejectedOrganizerAccount()
    } catch (e) {
      console.log('reject-cleanup error', e)
    } finally {
      setVisible(false)
      await auth.signOut()
    }
  }

  return (
    <PopModal visible={visible} onClose={() => {}} dismissable={false} title="Application not approved">
      <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 23, marginBottom: space(6) }}>
        Your organiser application wasn't approved this time. Your account
        will be removed and you'll be signed out - you're welcome to sign up
        again anytime.
      </Text>
      <Button title="OK" onPress={acknowledge} loading={busy} />
    </PopModal>
  )
}
