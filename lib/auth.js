import { createContext, useContext, useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// Signup confirmation always routes through this hosted page (a Supabase
// Edge Function, supabase/functions/confirm-email) rather than straight to
// the app's own deep link. The page carries the ACTUAL app URL live at
// signup time as `to` and attempts that handoff itself - so this one URL
// works whether `to` turns out to be an EAS build's fixed lumenara:// scheme
// or Expo Go's ephemeral exp://host:port scheme, without guessing which.
// Same device + app able to own that scheme -> the page is only ever
// glimpsed before the OS switches to the app. Different device, or Expo Go
// (which can't own the app's own lumenara:// scheme the way a real build
// does) -> the page stays up and shows a plain "you're verified" fallback.
const CONFIRM_EMAIL_PAGE = 'https://uytrqielaxckajbbnzhq.supabase.co/functions/v1/confirm-email'

function confirmEmailRedirect() {
  const appTarget = Linking.createURL('auth/confirm')
  return `${CONFIRM_EMAIL_PAGE}?to=${encodeURIComponent(appTarget)}`
}

// Supabase auth email links (signup confirmation, password recovery) carry
// the session either as access_token/refresh_token in the URL fragment
// (implicit flow) or as a `code` query param (PKCE flow) - handle both since
// the project's configured flow type isn't something the app controls.
export function parseAuthTokensFromUrl(url) {
  if (!url) return null

  const hashPart = url.split('#')[1]
  if (hashPart) {
    const params = new URLSearchParams(hashPart)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (access_token && refresh_token) return { kind: 'implicit', access_token, refresh_token }
  }

  const queryPart = url.split('?')[1]?.split('#')[0]
  if (queryPart) {
    const code = new URLSearchParams(queryPart).get('code')
    if (code) return { kind: 'pkce', code }
  }

  return null
}

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

  // --- auth actions ---

  async function signUpUser({ email, password, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'user', display_name: username },
        emailRedirectTo: confirmEmailRedirect(),
      },
    })
    if (error) throw error
    // With email confirmation on, a repeat signup returns a user whose
    // identities array is empty - that means the email already exists.
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please log in instead.')
    }
  }

  async function signUpOrganizer({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'organizer', display_name: name },
        emailRedirectTo: confirmEmailRedirect(),
      },
    })
    if (error) throw error
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please log in instead.')
    }
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
