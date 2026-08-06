import { createContext, useContext, useState } from 'react'

// Stand-in for the real Supabase auth context.
// Same shape as the eventual real version, so swapping later
// only touches this file.

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// 'guest' | 'user' | 'organizerPending' | 'organizer' | 'admin'
export const MODES = [
  { key: 'guest', label: 'Guest' },
  { key: 'user', label: 'User' },
  { key: 'organizerPending', label: 'Org (pending)' },
  { key: 'organizer', label: 'Org (approved)' },
  { key: 'admin', label: 'Admin' },
]

export function AuthProvider({ children }) {
  const [mode, setMode] = useState('guest')
  const [username, setUsername] = useState('EventFan123')
  const [orgName, setOrgName] = useState('My Organisation')

  const value = {
    mode,
    setMode,

    isGuest: mode === 'guest',
    isUser: mode === 'user',
    isOrganizer: mode === 'organizer' || mode === 'organizerPending',
    isApprovedOrganizer: mode === 'organizer',
    isPending: mode === 'organizerPending',
    isAdmin: mode === 'admin',

    username,
    setUsername,
    orgName,
    setOrgName,

    displayName:
      mode === 'user' ? username : mode === 'admin' ? 'Admin' : orgName,

    signIn: (m) => setMode(m),
    signOut: () => setMode('guest'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
