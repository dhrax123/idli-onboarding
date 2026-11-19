import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function copyText(text: string, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label, { description: text.length > 60 ? undefined : text })
  } catch {
    toast.error('Could not copy to clipboard')
  }
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}

export function normaliseUrl(raw: string) {
  const v = raw.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

export function isLikelyUrl(raw: string) {
  const v = raw.trim()
  if (!v) return true
  try {
    const u = new URL(normaliseUrl(v))
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

/** Maps Postgres "raise exception" codes from our RPCs to human messages. */
export function friendlyError(err: unknown): string {
  const msg = (err as { message?: string })?.message ?? String(err)
  if (msg.includes('invalid_link')) return 'This onboarding link is invalid or has expired.'
  if (msg.includes('already_submitted')) return 'This onboarding has already been submitted.'
  if (msg.startsWith('incomplete:')) return 'A few required answers are missing.'
  if (msg.includes('too_many_files')) return 'You have reached the 50 file limit.'
  if (msg.includes('not_authorised')) return 'Your account is not part of the Idli Studios team.'
  if (msg.includes('Failed to fetch')) return 'Network error — check your connection.'
  return msg
}
