/**
 * PREVIEW MODE BACKEND
 * Used only when Supabase env vars are missing. Everything is stored in this
 * browser's localStorage so the full flow can be clicked through on a preview
 * deployment. A banner in the UI makes clear nothing reaches a server.
 * As soon as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, this file is unused.
 */
import { emptyOnboardingData } from './options'
import { PRESET_PALETTES } from './colour'
import type { AssetRecord, ClientMeta, OnboardingData, OnboardingStatus, SessionMeta } from './types'

interface DemoAsset extends AssetRecord { data_url?: string }
interface DemoComment { id: string; body: string; created_at: string; author_id: string; author: { full_name: string; email: string } }
interface DemoSession {
  session: Required<Pick<SessionMeta, 'public_token' | 'client_id'>> & SessionMeta & { expires_at: string | null; first_opened_at: string | null }
  client: ClientMeta & { id: string }
  data: OnboardingData
  assets: DemoAsset[]
  comments: DemoComment[]
}

const KEY = 'idli-preview-db-v1'
export const DEMO_USER = { id: 'demo-user', email: 'dhiraj@idlistudios.com', full_name: 'Dhiraj', role: 'admin' as const }

const uid = () => crypto.randomUUID()
const token = () => {
  const b = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'
const now = () => new Date().toISOString()
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

function newSession(company: string, project: string, extra: Partial<ClientMeta> = {}, welcome: string | null = null): DemoSession {
  const clientId = uid()
  return {
    session: {
      id: uid(), project_name: project, slug: slugify(company), public_token: token(), client_id: clientId,
      status: 'not_started', current_step: 0, progress: 0, welcome_message: welcome, submitted_at: null,
      last_activity_at: null, created_at: now(), updated_at: now(), expires_at: null, first_opened_at: null,
    },
    client: { id: clientId, company_name: company, contact_name: null, email: null, phone: null, industry: null, notes: null, ...extra },
    data: emptyOnboardingData(company),
    assets: [],
    comments: [],
  }
}

function seed(): DemoSession[] {
  const a = newSession('Northbound Coffee', 'Website redesign', { contact_name: 'Ananya Rao', email: 'ananya@northbound.in', phone: '+91 98765 43210', industry: 'Food & Beverage', notes: 'Referred by Yuveer. Wants launch before Diwali sale.' })
  const lux = PRESET_PALETTES.find((p) => p.name === 'Earth')!
  a.data = {
    business: { company_name: 'Northbound Coffee', about: 'Specialty coffee roaster in Bengaluru sourcing directly from small estates in Chikmagalur and Coorg.', industry: 'Food & Beverage', offerings: 'Single-origin beans, monthly subscriptions, brewing gear, café wholesale.', target_audience: 'Urban professionals aged 24–40 who care about origin, taste and design.', differentiators: 'Estate-direct sourcing, roast-to-door in 48 hours, beautiful packaging.', has_website: 'yes', website_url: 'northbound.in', social_links: ['instagram.com/northboundcoffee'] },
    project: { project_types: ['ecommerce', 'redesign'], other_type: '', objective: 'Grow subscriptions and look as premium as the product.', functionality: 'Shop, subscriptions, brew guides, wholesale enquiry form, blog.', integrations: 'Razorpay, Shiprocket, WhatsApp, Klaviyo', timeline: 'Within 1–2 months', launch_date: '', expected_outcome: '2× subscription sign-ups within six months.', budget_range: '₹1.5L – ₹4L' },
    brand: { personalities: ['premium', 'minimal', 'editorial'], notes: 'Warm, quiet, crafted. Never loud.' },
    typography: { heading_font: 'Playfair Display', body_font: 'DM Sans', accent_font: null, saved_combinations: [{ heading: 'Playfair Display', body: 'DM Sans', accent: null }, { heading: 'Cormorant Garamond', body: 'Manrope', accent: null }] },
    colours: { ...lux.colours, preset: 'Earth' },
    layout: { navigation: 'centered', hero: 'split', buttons: 'pill', cards: 'filled', sections: 'alternating', images: 'arch', footer: 'cta', notes: '' },
    inspiration: [{ url: 'aesop.com', likes: 'Quiet, tactile, beautiful product photography', comment: '' }, { url: 'bluebottlecoffee.com', likes: 'Subscription flow is very clear', comment: '' }, { url: 'linear.app', likes: 'Typography and spacing', comment: '' }],
    competitors: { items: [{ name: 'Blue Tokai', url: 'bluetokaicoffee.com', likes: 'Strong product range', avoid: 'Busy homepage' }], notes: 'Avoid stock photos of coffee beans.' },
    technical: { answers: { own_domain: 'yes', hosting: 'no', logo: 'yes', brand_guidelines: 'unsure', content_ready: 'no', copywriting: 'yes', seo: 'yes', analytics: 'yes', third_party: 'yes', admin_dashboard: 'no', maintenance: 'yes' }, domain_name: 'northbound.in', hosting_provider: '', integration_notes: 'Razorpay, Shiprocket', notes: '' },
  }
  a.session.status = 'submitted'; a.session.progress = 100; a.session.current_step = 10
  a.session.submitted_at = new Date(Date.now() - 3600e3 * 5).toISOString(); a.session.last_activity_at = a.session.submitted_at
  a.session.first_opened_at = new Date(Date.now() - 86400e3).toISOString()
  a.comments.push({ id: uid(), body: 'Love the Earth palette — test against their product photography.', created_at: now(), author_id: DEMO_USER.id, author: { full_name: DEMO_USER.full_name, email: DEMO_USER.email } })

  const b = newSession('Coalesca Technologies', 'Corporate website', { contact_name: 'Rahul', industry: 'Technology & SaaS' })
  b.session.status = 'in_progress'; b.session.progress = 38; b.session.current_step = 4
  b.session.last_activity_at = new Date(Date.now() - 3600e3 * 26).toISOString(); b.session.first_opened_at = b.session.last_activity_at
  b.data.business.about = 'B2B technology consultancy.'; b.data.project.project_types = ['corporate']

  const c = newSession('Jani Farsan House', 'E-commerce launch', { industry: 'Food & Beverage' })
  return [c, b, a]
}

function load(): DemoSession[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const s = seed()
  save(s)
  return s
}
function save(db: DemoSession[]) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { throw new Error('Browser storage is full — preview mode keeps files in localStorage.') }
}
const byToken = (db: DemoSession[], t: string) => {
  const s = db.find((x) => x.session.public_token === t)
  if (!s || s.session.status === 'archived' || (s.session.expires_at && s.session.expires_at < now())) throw new Error('invalid_link')
  return s
}
const editable = (s: DemoSession) => { if (!['not_started', 'in_progress'].includes(s.session.status)) throw new Error('already_submitted') }

function payload(s: DemoSession, internal: boolean) {
  const x = s.session
  const pubSession: SessionMeta = {
    id: x.id, project_name: x.project_name, slug: x.slug, status: x.status, current_step: x.current_step, progress: x.progress,
    welcome_message: x.welcome_message, submitted_at: x.submitted_at, last_activity_at: x.last_activity_at, created_at: x.created_at, updated_at: x.updated_at,
  }
  return {
    session: internal ? x : pubSession,
    client: internal ? s.client : { company_name: s.client.company_name, contact_name: s.client.contact_name },
    ...structuredClone(s.data),
    assets: s.assets.map((a): AssetRecord => ({
      id: a.id, file_name: a.file_name, mime_type: a.mime_type, size_bytes: a.size_bytes, category: a.category, created_at: a.created_at,
      ...(internal ? { storage_path: a.id } : {}),
    })),
  }
}

export const demo = {
  /* ---------- client ---------- */
  getOnboarding(t: string) {
    const db = load(); const s = byToken(db, t)
    s.session.first_opened_at ??= now(); save(db)
    return delay(payload(s, false))
  },
  saveOnboarding(t: string, data: OnboardingData, step: number, progress: number) {
    const db = load(); const s = byToken(db, t); editable(s)
    s.data = structuredClone(data)
    Object.assign(s.session, { status: 'in_progress', current_step: step, progress, last_activity_at: now(), updated_at: now() })
    save(db); return delay({ saved_at: now() })
  },
  submitOnboarding(t: string) {
    const db = load(); const s = byToken(db, t); editable(s)
    if (!s.data.business.company_name || !s.data.business.about || !s.data.project.project_types.length || !s.data.brand.personalities.length) throw new Error('incomplete:required')
    Object.assign(s.session, { status: 'submitted', submitted_at: now(), progress: 100, last_activity_at: now() })
    save(db); return delay({ submitted_at: now() })
  },
  async uploadAsset(t: string, file: File, category: AssetRecord['category']): Promise<AssetRecord> {
    const db = load(); const s = byToken(db, t); editable(s)
    if (file.size > 1.5 * 1024 * 1024) throw new Error('Preview mode stores files in your browser, so it accepts files up to 1.5 MB. The live version accepts 25 MB.')
    const data_url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file) })
    const rec: DemoAsset = { id: uid(), file_name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, category, created_at: now(), data_url }
    s.assets.push(rec); save(db)
    return { id: rec.id, file_name: rec.file_name, mime_type: rec.mime_type, size_bytes: rec.size_bytes, category: rec.category, created_at: rec.created_at }
  },
  removeAsset(t: string, id: string) {
    const db = load(); const s = byToken(db, t); editable(s)
    s.assets = s.assets.filter((a) => a.id !== id); save(db); return delay(undefined)
  },

  /* ---------- agency ---------- */
  stats() {
    const db = load().filter((s) => s.session.status !== 'archived')
    const c = (f: (s: OnboardingStatus) => boolean) => db.filter((x) => f(x.session.status)).length
    const week = Date.now() - 7 * 86400e3
    return delay({
      total_clients: new Set(load().map((s) => s.client.id)).size, total_sessions: db.length,
      pending: c((s) => s === 'not_started' || s === 'in_progress'), not_started: c((s) => s === 'not_started'), in_progress: c((s) => s === 'in_progress'),
      completed: c((s) => ['submitted', 'in_review', 'completed'].includes(s)),
      submitted_this_week: db.filter((x) => x.session.submitted_at && new Date(x.session.submitted_at).getTime() > week).length,
    })
  },
  sessions() {
    return delay(load().sort((a, b) => b.session.created_at.localeCompare(a.session.created_at)).map((s) => ({
      ...s.session, client: { id: s.client.id, company_name: s.client.company_name, contact_name: s.client.contact_name, email: s.client.email ?? null },
    })))
  },
  create(input: { company_name: string; project_name: string; contact_name?: string; email?: string; phone?: string; industry?: string; notes?: string; welcome_message?: string }) {
    const db = load()
    const s = newSession(input.company_name.trim(), input.project_name.trim(), { contact_name: input.contact_name || null, email: input.email || null, phone: input.phone || null, industry: input.industry || null, notes: input.notes || null }, input.welcome_message || null)
    db.push(s); save(db)
    return delay({ id: s.session.id, slug: s.session.slug, public_token: s.session.public_token })
  },
  detail(id: string) {
    const s = load().find((x) => x.session.id === id)
    if (!s) throw new Error('Session not found')
    return delay(payload(s, true))
  },
  patch(id: string, patch: Partial<DemoSession['session']>) {
    const db = load(); const s = db.find((x) => x.session.id === id)
    if (s) Object.assign(s.session, patch, { updated_at: now() })
    save(db); return delay(undefined)
  },
  regenerate(id: string) {
    const t = token(); return demo.patch(id, { public_token: t }).then(() => t)
  },
  remove(id: string) { save(load().filter((x) => x.session.id !== id)); return delay(undefined) },
  comments(id: string) { return delay(load().find((x) => x.session.id === id)?.comments ?? []) },
  addComment(id: string, body: string) {
    const db = load(); const s = db.find((x) => x.session.id === id)
    s?.comments.push({ id: uid(), body, created_at: now(), author_id: DEMO_USER.id, author: { full_name: DEMO_USER.full_name, email: DEMO_USER.email } })
    save(db); return delay(undefined)
  },
  deleteComment(cid: string) {
    const db = load(); db.forEach((s) => { s.comments = s.comments.filter((c) => c.id !== cid) }); save(db); return delay(undefined)
  },
  assetBlob(assetId: string): Blob | null {
    for (const s of load()) {
      const a = s.assets.find((x) => x.id === assetId)
      if (a?.data_url) {
        const [head, b64] = a.data_url.split(',')
        const bin = atob(b64); const arr = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
        return new Blob([arr], { type: head.slice(5).split(';')[0] })
      }
    }
    return null
  },
  reset() { localStorage.removeItem(KEY) },
}
