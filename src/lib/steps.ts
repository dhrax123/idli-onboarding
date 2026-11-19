import type { OnboardingData } from './types'

export const STEPS = [
  { id: 'welcome', label: 'Welcome', short: 'Welcome' },
  { id: 'business', label: 'Business discovery', short: 'Business' },
  { id: 'project', label: 'Project requirements', short: 'Project' },
  { id: 'brand', label: 'Brand personality', short: 'Brand' },
  { id: 'fonts', label: 'Typography studio', short: 'Fonts' },
  { id: 'colours', label: 'Colour studio', short: 'Colours' },
  { id: 'layout', label: 'Layout preferences', short: 'Layout' },
  { id: 'inspiration', label: 'Website inspiration', short: 'Inspiration' },
  { id: 'competitors', label: 'Competitor analysis', short: 'Competitors' },
  { id: 'technical', label: 'Technical requirements', short: 'Technical' },
  { id: 'review', label: 'Final review', short: 'Review' },
] as const

export type StepId = (typeof STEPS)[number]['id']

/** Studio steps render with the live preview beside them. */
export const STUDIO_STEPS: StepId[] = ['fonts', 'colours', 'layout']

const filled = (v: string | null | undefined) => Boolean(v && v.trim())

/** Per-step completion checks, used for progress and the review screen. */
export function stepCompletion(d: OnboardingData): Record<StepId, boolean> {
  return {
    welcome: true,
    business: filled(d.business.company_name) && filled(d.business.about) && filled(d.business.target_audience),
    project: d.project.project_types.length > 0 && filled(d.project.objective),
    brand: d.brand.personalities.length > 0,
    fonts: filled(d.typography.heading_font) && filled(d.typography.body_font),
    colours: true,
    layout: true,
    inspiration: d.inspiration.some((r) => filled(r.url)),
    competitors: d.competitors.items.some((c) => filled(c.name) || filled(c.url)) || filled(d.competitors.notes),
    technical: Object.keys(d.technical.answers).length >= 6,
    review: false,
  }
}

export function computeProgress(d: OnboardingData, visitedUpTo: number) {
  const done = stepCompletion(d)
  const scored = STEPS.slice(1, -1)
  const points = scored.reduce((sum, s, i) => {
    const visited = i + 1 <= visitedUpTo
    return sum + (done[s.id] && (visited || s.id === 'business') ? 1 : 0)
  }, 0)
  return Math.round((points / scored.length) * 95)
}

/** Requirements enforced server-side by submit_onboarding. */
export function missingForSubmit(d: OnboardingData): { step: number; message: string }[] {
  const out: { step: number; message: string }[] = []
  if (!filled(d.business.company_name)) out.push({ step: 1, message: 'Company or brand name' })
  if (!filled(d.business.about)) out.push({ step: 1, message: 'A short description of your business' })
  if (d.project.project_types.length === 0) out.push({ step: 2, message: 'What you would like us to build' })
  if (d.brand.personalities.length === 0) out.push({ step: 3, message: 'At least one brand personality' })
  return out
}
