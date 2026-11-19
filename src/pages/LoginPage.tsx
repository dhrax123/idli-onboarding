import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import { Button, Field, Input, Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { requireSupabase } from '@/lib/supabase'

export function LoginPage() {
  const { session, profile, loading, notMember, signOut } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [sent, setSent] = useState(false)

  if (!loading && session && profile) {
    const to = (location.state as { from?: string } | null)?.from ?? '/dashboard'
    return <Navigate to={to} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const sb = requireSupabase()
      if (mode === 'password') {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        const { error } = await sb.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/dashboard` },
        })
        if (error) throw error
        setSent(true)
      }
    } catch (err) {
      const msg = (err as Error).message
      toast.error(msg.includes('Signups not allowed') ? 'This email is not on the Idli Studios team.' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 sm:p-10">
        <BrandMark />
        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="font-display text-[44px] leading-none">Team sign in</h1>
          <p className="mt-3 text-sm text-muted">Internal dashboard for the Idli Studios team.</p>

          {notMember && session ? (
            <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm">
              <p className="font-medium">{session.user.email} isn’t on the team.</p>
              <p className="mt-1 text-muted">Ask an admin to invite you from Supabase Auth.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={signOut}>Sign out</Button>
            </div>
          ) : sent ? (
            <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm">
              <Mail className="mb-3 size-5 text-muted" />
              <p className="font-medium">Check your inbox</p>
              <p className="mt-1 text-muted">We sent a sign-in link to {email}.</p>
              <Button variant="link" className="mt-3" onClick={() => setSent(false)}>Use a different email</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
              <Field label="Work email" htmlFor="email">
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@idlistudios.com" />
              </Field>
              {mode === 'password' && (
                <Field label="Password" htmlFor="password">
                  <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
              )}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? <Spinner /> : null}
                {mode === 'password' ? 'Sign in' : 'Email me a sign-in link'} {!busy && <ArrowRight />}
              </Button>
              <button type="button" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}>
                {mode === 'password' ? 'Use a magic link instead' : 'Use a password instead'}
              </button>
            </form>
          )}
        </div>
        <p className="text-xs text-faint">Clients don’t need an account — they use the private link you send them.</p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(60% 50% at 70% 30%, #44403c 0%, transparent 70%), radial-gradient(40% 40% at 20% 80%, #292524 0%, transparent 70%)' }} />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-display text-[56px] leading-[1.02]">Every brief,<br /><em>beautifully</em> structured.</p>
          <p className="mt-5 max-w-md text-sm text-white/60">Create onboarding links, watch clients shape their own design direction, and export a creative brief your designers can start from on day one.</p>
        </div>
      </div>
    </div>
  )
}
