import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { DEMO_USER } from '@/lib/demo-store'

interface AgencyProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member'
}

interface AuthState {
  session: Session | null
  profile: AgencyProfile | null
  loading: boolean
  /** Signed in, but not listed in agency_users. */
  notMember: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AgencyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notMember, setNotMember] = useState(false)

  useEffect(() => {
    if (!supabase) {
      // Preview mode: signed in as a demo team member, data lives in this browser.
      if (!isSupabaseConfigured) {
        setSession({ user: { id: DEMO_USER.id, email: DEMO_USER.email } } as unknown as Session)
        setProfile(DEMO_USER)
      }
      setLoading(false)
      return
    }
    const sb = supabase
    let active = true

    async function loadProfile(s: Session | null) {
      setSession(s)
      if (!s) {
        setProfile(null)
        setNotMember(false)
        setLoading(false)
        return
      }
      const { data } = await sb.from('agency_users').select('id, email, full_name, role').eq('id', s.user.id).maybeSingle()
      if (!active) return
      setProfile(data as AgencyProfile | null)
      setNotMember(!data)
      setLoading(false)
    }

    sb.auth.getSession().then(({ data }) => loadProfile(data.session))
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      // Defer to avoid calling Supabase inside the auth callback.
      setTimeout(() => void loadProfile(s), 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase?.auth.signOut()
  }

  return <AuthContext.Provider value={{ session, profile, loading, notMember, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
