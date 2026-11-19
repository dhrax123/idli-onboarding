import { ASSET_BUCKET, requireSupabase } from './supabase'
import { emptyOnboardingData } from './options'
import type { AssetRecord, OnboardingData, OnboardingPayload } from './types'
import { DEFAULT_COLOURS } from './colour'

type Raw = Record<string, unknown> | null | undefined

/** Replaces nulls from the database with the editor's empty defaults. */
function mergeDefaults<T extends object>(defaults: T, raw: Raw): T {
  const out = { ...defaults } as Record<string, unknown>
  if (!raw) return out as T
  for (const key of Object.keys(defaults)) {
    const v = raw[key]
    if (v !== null && v !== undefined) out[key] = v
  }
  return out as T
}

export function normalisePayload(raw: Record<string, any>): OnboardingPayload {
  const base = emptyOnboardingData(raw.client?.company_name ?? '')
  const business = mergeDefaults(base.business, raw.business)
  if (!business.social_links?.length) business.social_links = ['']
  const inspiration = (raw.inspiration ?? []).map((r: Raw) => mergeDefaults({ url: '', likes: '', comment: '' }, r))
  while (inspiration.length < 3) inspiration.push({ url: '', likes: '', comment: '' })
  const compItems = (raw.competitors?.items ?? []).map((r: Raw) => mergeDefaults({ name: '', url: '', likes: '', avoid: '' }, r))
  if (!compItems.length) compItems.push({ name: '', url: '', likes: '', avoid: '' })

  return {
    session: raw.session,
    client: raw.client,
    assets: raw.assets ?? [],
    business,
    project: mergeDefaults(base.project, raw.project),
    brand: mergeDefaults(base.brand, raw.brand),
    typography: mergeDefaults(base.typography, raw.typography),
    colours: mergeDefaults(DEFAULT_COLOURS, raw.colours),
    layout: mergeDefaults(base.layout, raw.layout),
    inspiration,
    competitors: { items: compItems, notes: raw.competitors?.notes ?? '' },
    technical: { ...mergeDefaults(base.technical, raw.technical), answers: raw.technical?.answers ?? {} },
  }
}

export async function fetchOnboarding(token: string): Promise<OnboardingPayload> {
  const { data, error } = await requireSupabase().rpc('get_onboarding', { p_token: token })
  if (error) throw error
  return normalisePayload(data)
}

export async function saveOnboarding(token: string, data: OnboardingData, currentStep: number, progress: number) {
  const { data: res, error } = await requireSupabase().rpc('save_onboarding', {
    p_token: token,
    p_data: data,
    p_current_step: currentStep,
    p_progress: progress,
  })
  if (error) throw error
  return res as { saved_at: string }
}

export async function submitOnboarding(token: string) {
  const { data, error } = await requireSupabase().rpc('submit_onboarding', { p_token: token })
  if (error) throw error
  return data as { submitted_at: string }
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const ACCEPTED_UPLOADS =
  'image/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.ai,.eps,.psd,.ttf,.otf,.woff,.woff2,.txt,.svg'

const EXT_MIME: Record<string, string> = {
  ai: 'application/illustrator', eps: 'application/postscript', psd: 'image/vnd.adobe.photoshop',
  ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2', svg: 'image/svg+xml',
}

function safeFileName(name: string) {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').slice(0, 60)
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  return `${base || 'file'}${ext ? '.' + ext : ''}`
}

export async function uploadAsset(token: string, file: File, category: AssetRecord['category']): Promise<AssetRecord> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 25 MB`)
  const sb = requireSupabase()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const contentType = file.type || EXT_MIME[ext] || 'application/octet-stream'
  const path = `${token}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`
  const { error: upErr } = await sb.storage.from(ASSET_BUCKET).upload(path, file, { contentType, upsert: false })
  if (upErr) {
    if (/mime|type/i.test(upErr.message)) throw new Error(`${file.name}: this file type is not accepted`)
    throw upErr
  }
  const { data, error } = await sb.rpc('register_asset', {
    p_token: token,
    p_storage_path: path,
    p_file_name: file.name,
    p_mime_type: contentType,
    p_size_bytes: file.size,
    p_category: category,
  })
  if (error) throw error
  return data as AssetRecord
}

export async function removeAsset(token: string, assetId: string) {
  const { error } = await requireSupabase().rpc('remove_asset', { p_token: token, p_asset_id: assetId })
  if (error) throw error
}
