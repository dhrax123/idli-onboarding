import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { LayoutGrid, LogOut, Menu, Palette, X } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Onboardings', icon: LayoutGrid, end: true },
  { to: '/playground', label: 'Design playground', icon: Palette, end: false },
]

export function DashboardLayout() {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Spinner className="text-muted" /></div>
  }
  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><BrandMark /></div>
      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn('flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
                isActive ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-muted hover:bg-subtle hover:text-ink')
            }
          >
            <Icon className="size-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-[12px] font-semibold uppercase text-white">
            {(profile.full_name || profile.email).slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{profile.full_name || profile.email.split('@')[0]}</div>
            <div className="truncate text-[11px] capitalize text-muted">{profile.role}</div>
          </div>
          <button type="button" onClick={signOut} className="grid size-8 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink" title="Sign out" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-canvas lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <BrandMark />
        <button type="button" onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-md hover:bg-subtle" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/25" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-canvas shadow-xl animate-fade-in">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 grid size-8 place-items-center rounded-md hover:bg-subtle" aria-label="Close menu">
              <X className="size-4" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
