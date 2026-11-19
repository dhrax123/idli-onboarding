import type { ColourData, ColourRole } from './types'

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export function normaliseHex(input: string): string | null {
  let v = input.trim().replace(/^#?/, '#')
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) v = '#' + v.slice(1).split('').map((c) => c + c).join('')
  return HEX_RE.test(v) ? v.toUpperCase() : null
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex(r: number, g: number, b: number) {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Picks black or white text for legibility on top of the given colour. */
export function onColour(hex: string) {
  return contrastRatio(hex, '#FFFFFF') >= contrastRatio(hex, '#0A0A0A') ? '#FFFFFF' : '#0A0A0A'
}

export function wcagLabel(ratio: number) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

export const COLOUR_ROLES: { role: ColourRole; label: string; usage: string }[] = [
  { role: 'primary', label: 'Primary', usage: 'Main buttons, links, key highlights' },
  { role: 'secondary', label: 'Secondary', usage: 'Supporting surfaces, secondary buttons' },
  { role: 'accent', label: 'Accent', usage: 'Badges, icons, small moments of emphasis' },
  { role: 'background', label: 'Background', usage: 'Page background' },
  { role: 'text', label: 'Text', usage: 'Headings and body copy' },
]

export interface Palette {
  name: string
  description: string
  colours: Omit<ColourData, 'preset'>
}

export const PRESET_PALETTES: Palette[] = [
  { name: 'Midnight', description: 'Deep navy with electric highlights', colours: { primary: '#6366F1', secondary: '#1E293B', accent: '#22D3EE', background: '#0B1020', text: '#E2E8F0' } },
  { name: 'Minimal', description: 'Monochrome and quiet', colours: { primary: '#111111', secondary: '#E5E5E5', accent: '#737373', background: '#FFFFFF', text: '#0A0A0A' } },
  { name: 'Ocean', description: 'Calm blues and fresh teal', colours: { primary: '#0369A1', secondary: '#E0F2FE', accent: '#14B8A6', background: '#F8FCFF', text: '#0C2537' } },
  { name: 'Earth', description: 'Clay, olive and warm sand', colours: { primary: '#9A3412', secondary: '#E7DCC8', accent: '#4D7C0F', background: '#FBF7F0', text: '#2B2118' } },
  { name: 'Luxury', description: 'Black, ivory and soft gold', colours: { primary: '#B08D57', secondary: '#1C1917', accent: '#D6C3A1', background: '#FAF7F2', text: '#141210' } },
  { name: 'Vibrant', description: 'Loud, joyful and energetic', colours: { primary: '#E11D48', secondary: '#FDE047', accent: '#7C3AED', background: '#FFFBF5', text: '#1A1A2E' } },
  { name: 'Corporate', description: 'Trustworthy blue and slate', colours: { primary: '#1D4ED8', secondary: '#E2E8F0', accent: '#0EA5E9', background: '#FFFFFF', text: '#0F172A' } },
  { name: 'Modern', description: 'Violet primary on soft neutral', colours: { primary: '#7C3AED', secondary: '#EDE9FE', accent: '#F59E0B', background: '#FCFCFD', text: '#111827' } },
]

export const DEFAULT_COLOURS: ColourData = { ...PRESET_PALETTES[1].colours, preset: 'Minimal' }

/** Builds the CSS custom properties consumed by the live preview. */
export function colourVars(c: ColourData): Record<string, string> {
  return {
    '--lp-primary': c.primary,
    '--lp-secondary': c.secondary,
    '--lp-accent': c.accent,
    '--lp-bg': c.background,
    '--lp-text': c.text,
    '--lp-on-primary': onColour(c.primary),
    '--lp-on-secondary': onColour(c.secondary),
    '--lp-on-accent': onColour(c.accent),
  }
}
