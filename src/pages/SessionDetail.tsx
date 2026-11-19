import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, Download, FileDown, KeyRound, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BriefSummary } from '@/components/brief/BriefSummary'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { ShareButtons } from '@/components/dashboard/NewSessionDialog'
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import {
  addComment, assetUrl, deleteComment, deleteSession, downloadAllAssets, fetchComments, fetchSessionDetail,
  regenerateToken, STATUS_META, triggerDownload, updateExpiry, updateStatus, type InternalComment,
} from '@/lib/agency-api'
import { loadAllFonts } from '@/lib/fonts'
import { onboardingLink } from '@/lib/supabase'
import { STEPS } from '@/lib/steps'
import type { AssetRecord, OnboardingPayload, OnboardingStatus } from '@/lib/types'
import { formatDate, friendlyError, timeAgo } from '@/lib/utils'

function Comments({ sessionId }: { sessionId: string }) {
  const { profile } = useAuth()
  const [items, setItems] = useState<InternalComment[] | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => fetchComments(sessionId).then(setItems).catch((e) => toast.error(friendlyError(e))), [sessionId])
  useEffect(() => void load(), [load])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      await addComment(sessionId, body.trim())
      setBody('')
      await load()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold">Internal comments</h3>
        <p className="text-[12px] text-muted">Only visible to the Idli Studios team.</p>
      </div>
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto px-4 py-4">
        {!items ? <Spinner className="mx-auto text-muted" /> : items.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted">No comments yet.</p>
        ) : items.map((c) => (
          <div key={c.id} className="group flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-subtle text-[11px] font-semibold uppercase">{(c.author?.full_name || c.author?.email || '?').slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-medium">{c.author?.full_name || c.author?.email || 'Former member'}</span>
                <span className="text-[11px] text-faint">{timeAgo(c.created_at)}</span>
                {(c.author_id === profile?.id || profile?.role === 'admin') && (
                  <button type="button" onClick={() => deleteComment(c.id).then(load).catch((e) => toast.error(friendlyError(e)))} className="ml-auto text-faint opacity-0 hover:text-danger group-hover:opacity-100" aria-label="Delete comment">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line p-3">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note for the team…" maxLength={5000} className="text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit(e) }} />
        <Button type="submit" size="sm" className="self-end" disabled={busy || !body.trim()}>{busy ? <Spinner /> : <Send />} Comment</Button>
      </form>
    </Card>
  )
}

export function SessionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState<OnboardingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  const load = useCallback(() => fetchSessionDetail(id).then((d) => { setP(d); setError(null) }).catch((e) => setError(friendlyError(e))), [id])
  useEffect(() => {
    loadAllFonts()
    void load()
  }, [load])

  if (error) return <div className="p-10 text-sm text-danger">{error} <Link className="underline" to="/dashboard">Back</Link></div>
  if (!p) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="text-muted" /></div>

  const s = p.session
  const link = onboardingLink(s.slug, s.public_token!)
  const meta = STATUS_META[s.status]

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key)
    try {
      await fn()
      if (ok) toast.success(ok)
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setBusy(null)
    }
  }

  const openAsset = (a: AssetRecord) => run('asset', async () => window.open(await assetUrl(a), '_blank', 'noopener'))
  const downloadAsset = (a: AssetRecord) => run('asset', async () => {
    const res = await fetch(await assetUrl(a))
    triggerDownload(await res.blob(), a.file_name)
  })

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-3.5" /> All onboardings</Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight">{p.client.company_name}</h1>
            <Badge tone={meta.tone} dot>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {s.project_name} · Created {formatDate(s.created_at)}
            {s.submitted_at && ` · Submitted ${formatDate(s.submitted_at, true)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!p.assets.length || busy === 'zip'} onClick={() => run('zip', () => downloadAllAssets(p.assets, `${s.slug}-assets`), 'Assets downloaded')}>
            {busy === 'zip' ? <Spinner /> : <Download />} Assets ({p.assets.length})
          </Button>
          <Button disabled={busy === 'pdf'} onClick={() => run('pdf', async () => (await import('@/lib/pdf')).exportBriefPdf(p))}>
            {busy === 'pdf' ? <Spinner /> : <FileDown />} Export PDF brief
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Link + progress */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Client link</h2>
                <p className="text-[12px] text-muted">
                  {s.status === 'not_started' ? (s.first_opened_at ? `Opened ${timeAgo(s.first_opened_at)}, no answers yet` : 'Not opened yet') : `Last activity ${timeAgo(s.last_activity_at)}`}
                  {' · '}Step {Math.min(s.current_step, 10)} of 10 ({STEPS[Math.min(s.current_step, 10)].short})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${s.progress}%` }} /></div>
                <span className="font-mono text-[12px] text-muted">{s.progress}%</span>
              </div>
            </div>
            <code className="mt-4 block break-all rounded-lg border border-line bg-subtle px-3 py-2.5 text-[13px]">{link}</code>
            <div className="mt-3"><ShareButtons company={p.client.company_name} contact={p.client.contact_name} email={p.client.email} phone={p.client.phone} link={link} /></div>
          </Card>

          <PreviewPanel config={{ typography: p.typography, colours: p.colours, layout: p.layout, brandName: p.business.company_name || p.client.company_name }} />

          <BriefSummary data={p} assets={p.assets} agency onOpenAsset={openAsset} onDownloadAsset={downloadAsset} />
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <label className="text-[12px] font-medium text-muted" htmlFor="status">Status</label>
              <Select id="status" className="mt-1.5 h-10" value={s.status} disabled={busy === 'status'}
                onChange={(e) => run('status', async () => { await updateStatus(s.id, e.target.value as OnboardingStatus); await load() }, 'Status updated')}>
                {(Object.keys(STATUS_META) as OnboardingStatus[]).map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
              </Select>
              <p className="mt-1.5 text-[11px] text-muted">Set back to “In progress” to let the client edit again.</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted" htmlFor="expiry">Link expires</label>
              <Input id="expiry" type="date" className="mt-1.5 h-10" value={s.expires_at ? s.expires_at.slice(0, 10) : ''}
                onChange={(e) => run('expiry', async () => { await updateExpiry(s.id, e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null); await load() }, 'Expiry updated')} />
            </div>
          </Card>

          <Card className="p-5 text-sm">
            <h3 className="mb-3 font-semibold">Client</h3>
            <dl className="flex flex-col gap-2 text-[13px]">
              {([['Contact', p.client.contact_name], ['Email', p.client.email], ['Phone', p.client.phone], ['Industry', p.client.industry]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="truncate text-right">{v || '—'}</dd></div>
              ))}
            </dl>
            {p.client.notes && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-subtle p-3 text-[13px] text-ink-2">{p.client.notes}</p>}
          </Card>

          <Comments sessionId={s.id} />

          <Card className="flex flex-col gap-2 p-5">
            <h3 className="text-sm font-semibold">Manage</h3>
            <Button variant="outline" size="sm" className="justify-start" onClick={() => setConfirmRotate(true)}><KeyRound /> Generate new link</Button>
            {s.status !== 'archived' && (
              <Button variant="outline" size="sm" className="justify-start" onClick={() => run('archive', async () => { await updateStatus(s.id, 'archived'); await load() }, 'Archived — the client link no longer works')}>
                <Archive /> Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" className="justify-start text-danger hover:bg-red-50 hover:text-danger" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete permanently</Button>
          </Card>
        </aside>
      </div>

      <Dialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <DialogContent title="Generate a new link?" description="The current link stops working immediately. Uploaded files and answers are kept.">
          <div className="flex justify-end gap-2 px-6 py-5">
            <Button variant="outline" onClick={() => setConfirmRotate(false)}>Cancel</Button>
            <Button disabled={busy === 'rotate'} onClick={() => run('rotate', async () => { await regenerateToken(s.id); setConfirmRotate(false); await load() }, 'New link generated')}>
              {busy === 'rotate' && <Spinner />} Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title={`Delete ${p.client.company_name}’s onboarding?`} description="This removes every answer, comment and uploaded file. It cannot be undone.">
          <div className="flex justify-end gap-2 px-6 py-5">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" disabled={busy === 'delete'} onClick={() => run('delete', async () => { await deleteSession(s.id); navigate('/dashboard') }, 'Onboarding deleted')}>
              {busy === 'delete' && <Spinner />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
