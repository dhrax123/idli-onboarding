import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardHome } from '@/pages/DashboardHome'
import { SessionDetail } from '@/pages/SessionDetail'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'

function SetupRequired() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-lg">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Backend not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This deployment has no Supabase credentials, so nothing can be loaded or saved. Add these environment variables (locally in <code>.env</code>, or in Vercel → Project → Settings → Environment Variables) and redeploy:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface p-4 text-[13px]">{`VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_PUBLIC_APP_URL=https://idlistudios.com`}</pre>
        <p className="mt-4 text-sm text-muted">Then run the SQL migration in <code>supabase/migrations</code>. Full steps are in the README.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/playground">Open the design playground (works offline)</Link></Button>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-display text-[72px] leading-none">404</p>
        <p className="mt-3 text-sm text-muted">This page doesn’t exist.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  )
}

function NeedsBackend({ children }: { children: ReactNode }) {
  return isSupabaseConfigured ? <>{children}</> : <SetupRequired />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<NeedsBackend><LoginPage /></NeedsBackend>} />
          <Route path="/dashboard" element={<NeedsBackend><DashboardLayout /></NeedsBackend>}>
            <Route index element={<DashboardHome />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
          </Route>
          <Route path="/onboarding/:slug/:token" element={<NeedsBackend><OnboardingPage /></NeedsBackend>} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      <Toaster position="bottom-center" toastOptions={{ className: 'font-sans' }} />
    </BrowserRouter>
  </StrictMode>,
)
