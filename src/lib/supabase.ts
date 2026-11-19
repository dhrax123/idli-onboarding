import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the Supabase environment variables are present. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'))

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export const ASSET_BUCKET = 'client-assets'

export function publicAppUrl() {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '')
  return configured || window.location.origin
}

export function onboardingLink(slug: string, token: string) {
  return `${publicAppUrl()}/onboarding/${slug}/${token}`
}
