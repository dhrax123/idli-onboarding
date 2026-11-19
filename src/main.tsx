import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { demo } from '@/lib/demo-store'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardHome } from '@/pages/DashboardHome'
import { SessionDetail } from '@/pages/SessionDetail'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'

function PreviewBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-ink px-3 py-1.5 text-center text-[12px] text-white">
      <span className="size-1.5 rounded-full bg-amber-400" />
      Preview mode · data stays in this browser
      <button type="button" className="ml-1 underline underline-offset-2 opacity-70 hover:opacity-100" onClick={() => { demo.reset(); window.location.href = '/dashboard' }}>
        Reset
      </button>
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
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PreviewBanner />
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
      <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
    </BrowserRouter>
  </StrictMode>,
)
