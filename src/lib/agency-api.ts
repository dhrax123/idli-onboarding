import { ASSET_BUCKET, isSupabaseConfigured, requireSupabase } from './supabase'
import { demo } from './demo-store'
import { normalisePayload } from './onboarding-api'
import type { AssetRecord, OnboardingPayload, OnboardingStatus } from './types'

export interface SessionListItem {
  id: string
  project_name: string
  slug: string
  public_token: string
  status: OnboardingStatus
  progress: number
  current_step: number
  created_at: string
  last_activity_at: string | null
  submitted_at: string | null
  first_opened_at: string | null
  client: { id: string; company_name: string; contact_name: string | null; email: string | null }
}

export interface DashboardStats {
  total_clients: number
  total_sessions: number
  pending: number
  not_started: number
  in_progress: number
  completed: number
  submitted_this_week: number
}

export interface InternalComment {
  id: string
  body: string
  created_at: string
  author_id: string | null
  author: { full_name: string | null; email: string } | null
}

export const STATUS_META: Record<OnboardingStatus, { label: string; tone: 'neutral' | 'info' | 'warn' | 'success' | 'dark' | 'danger' }> = {
  not_started: { label: 'Not started', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'warn' },
  submitted: { label: 'Submitted', tone: 'info' },
  in_review: { label: 'In review', tone: 'dark' },
  completed: { label: 'Completed', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export async function fetchStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured) return demo.stats()
  const { data, error } = await requireSupabase().rpc('dashboard_stats')
  if (error) throw error
  return data
}

export async function fetchSessions(): Promise<SessionListItem[]> {
  if (!isSupabaseConfigured) return (await demo.sessions()) as SessionListItem[]
  const { data, error } = await requireSupabase()
    .from('onboarding_sessions')
    .select(
      'id, project_name, slug, public_token, status, progress, current_step, created_at, last_activity_at, submitted_at, first_opened_at, client:clients!inner(id, company_name, contact_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) throw error
  return (data ?? []) as unknown as SessionListItem[]
}

export interface NewSessionInput {
  company_name: string
  project_name: string
  contact_name?: string
  email?: string
  phone?: string
  industry?: string
  notes?: string
  welcome_message?: string
}

export async function createSession(input: NewSessionInput) {
  if (!isSupabaseConfigured) return demo.create(input)
  const { data, error } = await requireSupabase().rpc('create_onboarding_session', {
    p_company_name: input.company_name,
    p_project_name: input.project_name,
    p_contact_name: input.contact_name || null,
    p_email: input.email || null,
    p_phone: input.phone || null,
    p_industry: input.industry || null,
    p_notes: input.notes || null,
    p_welcome_message: input.welcome_message || null,
  })
  if (error) throw error
  return data as { id: string; slug: string; public_token: string }
}

export async function fetchSessionDetail(id: string): Promise<OnboardingPayload> {
  if (!isSupabaseConfigured) return normalisePayload(await demo.detail(id))
  const { data, error } = await requireSupabase().rpc('get_session_detail', { p_session_id: id })
  if (error) throw error
  if (!data) throw new Error('Session not found')
  return normalisePayload(data)
}

export async function updateStatus(id: string, status: OnboardingStatus) {
  if (!isSupabaseConfigured) return demo.patch(id, { status, ...(status === 'submitted' ? { submitted_at: new Date().toISOString() } : {}) })
  const patch: Record<string, unknown> = { status }
  if (status === 'submitted') patch.submitted_at = new Date().toISOString()
  const { error } = await requireSupabase().from('onboarding_sessions').update(patch).eq('id', id)
  if (error) throw error
}

export async function updateExpiry(id: string, expiresAt: string | null) {
  if (!isSupabaseConfigured) return demo.patch(id, { expires_at: expiresAt })
  const { error } = await requireSupabase().from('onboarding_sessions').update({ expires_at: expiresAt }).eq('id', id)
  if (error) throw error
}

export async function regenerateToken(id: string) {
  if (!isSupabaseConfigured) return demo.regenerate(id)
  const { data, error } = await requireSupabase().rpc('regenerate_session_token', { p_session_id: id })
  if (error) throw error
  return data as string
}

export async function deleteSession(id: string) {
  if (!isSupabaseConfigured) return demo.remove(id)
  const sb = requireSupabase()
  const { data: assets } = await sb.from('uploaded_assets').select('storage_path').eq('session_id', id)
  const { data: session } = await sb.from('onboarding_sessions').select('public_token, client_id').eq('id', id).single()
  // Collect every object in the session's folder, including files the client removed.
  const paths = new Set((assets ?? []).map((a) => a.storage_path as string))
  if (session?.public_token) {
    const { data: listed } = await sb.storage.from(ASSET_BUCKET).list(session.public_token, { limit: 1000 })
    listed?.forEach((o) => paths.add(`${session.public_token}/${o.name}`))
  }
  if (paths.size) await sb.storage.from(ASSET_BUCKET).remove([...paths])
  const { error } = await sb.from('onboarding_sessions').delete().eq('id', id)
  if (error) throw error
  // Remove the client too if this was their only onboarding.
  if (session?.client_id) {
    const { count } = await sb.from('onboarding_sessions').select('id', { count: 'exact', head: true }).eq('client_id', session.client_id)
    if (count === 0) await sb.from('clients').delete().eq('id', session.client_id)
  }
}

export async function fetchComments(sessionId: string): Promise<InternalComment[]> {
  if (!isSupabaseConfigured) return demo.comments(sessionId)
  const { data, error } = await requireSupabase()
    .from('internal_comments')
    .select('id, body, created_at, author_id, author:agency_users(full_name, email)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as InternalComment[]
}

export async function addComment(sessionId: string, body: string) {
  if (!isSupabaseConfigured) return demo.addComment(sessionId, body)
  const sb = requireSupabase()
  const { data: auth } = await sb.auth.getUser()
  const { error } = await sb.from('internal_comments').insert({ session_id: sessionId, body, author_id: auth.user?.id })
  if (error) throw error
}

export async function deleteComment(id: string) {
  if (!isSupabaseConfigured) return demo.deleteComment(id)
  const { error } = await requireSupabase().from('internal_comments').delete().eq('id', id)
  if (error) throw error
}

export async function assetUrl(asset: AssetRecord, download = false) {
  if (!isSupabaseConfigured) {
    const blob = demo.assetBlob(asset.id)
    if (!blob) throw new Error('File not found')
    return URL.createObjectURL(blob)
  }
  if (!asset.storage_path) throw new Error('Missing storage path')
  const { data, error } = await requireSupabase()
    .storage.from(ASSET_BUCKET)
    .createSignedUrl(asset.storage_path, 60 * 10, download ? { download: asset.file_name } : undefined)
  if (error) throw error
  return data.signedUrl
}

export async function downloadAllAssets(assets: AssetRecord[], zipName: string) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set<string>()
  for (const a of assets) {
    if (!a.storage_path) continue
    let data: Blob | null = null
    if (!isSupabaseConfigured) data = demo.assetBlob(a.id)
    else data = (await requireSupabase().storage.from(ASSET_BUCKET).download(a.storage_path)).data
    if (!data) continue
    let name = `${a.category}/${a.file_name}`
    let n = 1
    while (used.has(name)) name = `${a.category}/${n++}-${a.file_name}`
    used.add(name)
    zip.file(name, data)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, `${zipName}.zip`)
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
