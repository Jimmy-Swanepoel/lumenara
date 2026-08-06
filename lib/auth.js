import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organizer, setOrganizer] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null)
      setOrganizer(null)
      return
    }

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(p)

    if (p?.role === 'organizer') {
      const { data: o } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setOrganizer(o)
    } else {
      setOrganizer(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      await loadProfile(session?.user?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        await loadProfile(session?.user?.id)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function signUpUser({ email, password, username }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'user', display_name: username } },
    })
    if (error) throw error
  }

  async function signUpOrganizer({ email, password, name }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'organizer', display_name: name } },
    })
    if (error) throw error
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    profile,
    organizer,
    loading,
    user: session?.user ?? null,

    isGuest: !session,
    isUser: profile?.role === 'user',
    isOrganizer: profile?.role === 'organizer',
    isAdmin: profile?.role === 'admin',
    isApprovedOrganizer: organizer?.status === 'approved',
    isPending: profile?.role === 'organizer' && organizer?.status === 'pending',
    organizerStatus: organizer?.status ?? null,

    displayName: profile?.display_name ?? organizer?.name ?? 'Account',

    signUpUser,
    signUpOrganizer,
    signIn,
    signOut,
    refresh: () => loadProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
