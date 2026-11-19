import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Copy, Inbox, Plus, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, EmptyState, Input, Spinner } from '@/components/ui'
import { NewSessionDialog } from '@/components/dashboard/NewSessionDialog'
import { fetchSessions, fetchStats, STATUS_META, type DashboardStats, type SessionListItem } from '@/lib/agency-api'
import { onboardingLink } from '@/lib/supabase'
import type { OnboardingStatus } from '@/lib/types'
import { cn, copyText, friendlyError, timeAgo } from '@/lib/utils'

const FILTERS: { id: 'all' | 'pending' | OnboardingStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'in_review', label: 'In review' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
]

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-2 text-[32px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-2 text-[12px] text-muted">{hint}</div>}
    </Card>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-[12px] text-muted tabular-nums">{value}%</span>
    </div>
  )
}

export function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const [s, list] = await Promise.all([fetchStats(), fetchSessions()])
      setStats(s)
      setSessions(list)
      setError(null)
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    if (!sessions) return []
    const q = query.trim().toLowerCase()
    return sessions.filter((s) => {
      const statusOk =
        filter === 'all' ? s.status !== 'archived'
        : filter === 'pending' ? s.status === 'not_started' || s.status === 'in_progress'
        : s.status === filter
      const qOk = !q || [s.client.company_name, s.project_name, s.client.contact_name, s.client.email].some((v) => v?.toLowerCase().includes(q))
      return statusOk && qOk
    })
  }, [sessions, filter, query])

  const recentlySubmitted = sessions?.filter((s) => s.status === 'submitted').slice(0, 3) ?? []

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Client onboardings</h1>
          <p className="mt-1 text-sm text-muted">Create links, track progress and open submitted briefs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={refreshing} aria-label="Refresh">
            <RefreshCw className={cn(refreshing && 'animate-spin')} />
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus /> New onboarding
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">
          {error} <button type="button" className="ml-2 underline" onClick={load}>Try again</button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total clients" value={stats?.total_clients ?? '–'} />
        <Stat label="Pending onboardings" value={stats?.pending ?? '–'} hint={stats ? `${stats.not_started} not opened · ${stats.in_progress} in progress` : undefined} />
        <Stat label="Completed onboardings" value={stats?.completed ?? '–'} hint="Submitted, in review or completed" />
        <Stat label="Submitted this week" value={stats?.submitted_this_week ?? '–'} />
      </div>

      {recentlySubmitted.length > 0 && (
        <div className="mt-6 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center">
          <Inbox className="size-4 shrink-0 text-info" />
          <span className="text-sm text-ink-2">New briefs waiting for review:</span>
          <div className="flex flex-wrap gap-2">
            {recentlySubmitted.map((s) => (
              <Link key={s.id} to={`/dashboard/sessions/${s.id}`} className="rounded-full bg-surface px-3 py-1 text-[13px] font-medium shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink)]">
                {s.client.company_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="scrollbar-none flex gap-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn('h-8 shrink-0 rounded-md px-3 text-[13px] font-medium transition-colors', filter === f.id ? 'bg-subtle text-ink' : 'text-muted hover:text-ink')}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients" className="h-9 pl-9 text-sm" />
          </div>
        </div>

        {!sessions ? (
          <div className="grid place-items-center py-20"><Spinner className="text-muted" /></div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title={sessions.length === 0 ? 'No onboardings yet' : 'Nothing matches'}
            description={sessions.length === 0 ? 'Create your first onboarding link and send it to a client.' : 'Try a different filter or search.'}
            action={sessions.length === 0 && <Button onClick={() => setCreating(true)}><Plus /> New onboarding</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[12px] text-muted">
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Progress</th>
                  <th className="px-4 py-2.5 font-medium">Last activity</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((s) => {
                  const meta = STATUS_META[s.status]
                  return (
                    <tr key={s.id} onClick={() => navigate(`/dashboard/sessions/${s.id}`)} className="group cursor-pointer transition-colors hover:bg-subtle/60">
                      <td className="px-4 py-3.5">
                        <div className="font-medium">{s.client.company_name}</div>
                        <div className="text-[12px] text-muted">{s.project_name}{s.client.contact_name ? ` · ${s.client.contact_name}` : ''}</div>
                      </td>
                      <td className="px-4 py-3.5"><Badge tone={meta.tone} dot>{meta.label}</Badge></td>
                      <td className="px-4 py-3.5"><Progress value={s.progress} /></td>
                      <td className="px-4 py-3.5 text-muted">{s.status === 'not_started' ? (s.first_opened_at ? 'Opened' : 'Not opened') : timeAgo(s.last_activity_at)}</td>
                      <td className="px-4 py-3.5 text-muted">{timeAgo(s.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Copy client link"
                            onClick={(e) => { e.stopPropagation(); void copyText(onboardingLink(s.slug, s.public_token), 'Link copied') }}
                          >
                            <Copy />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Open client view" asChild>
                            <a href={onboardingLink(s.slug, s.public_token)} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}><ArrowUpRight /></a>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewSessionDialog open={creating} onOpenChange={setCreating} onCreated={() => { void load(); toast.success('Onboarding created') }} />
    </div>
  )
}
