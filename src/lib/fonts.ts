export type FontCategory = 'Sans Serif' | 'Serif' | 'Display' | 'Modern' | 'Minimal' | 'Editorial'

export interface FontDef {
  family: string
  fallback: 'sans-serif' | 'serif'
  categories: FontCategory[]
  /** Google Fonts css2 axis spec */
  axis: string
  note: string
}

export const FONT_CATEGORIES: FontCategory[] = ['Sans Serif', 'Serif', 'Display', 'Modern', 'Minimal', 'Editorial']

export const FONTS: FontDef[] = [
  { family: 'Inter', fallback: 'sans-serif', categories: ['Sans Serif', 'Minimal', 'Modern'], axis: 'wght@400;500;600;700', note: 'Neutral, highly legible UI workhorse' },
  { family: 'Manrope', fallback: 'sans-serif', categories: ['Sans Serif', 'Modern', 'Minimal'], axis: 'wght@400;500;600;700;800', note: 'Geometric with a soft, contemporary edge' },
  { family: 'DM Sans', fallback: 'sans-serif', categories: ['Sans Serif', 'Minimal'], axis: 'wght@400;500;600;700', note: 'Low-contrast, friendly and calm' },
  { family: 'Poppins', fallback: 'sans-serif', categories: ['Sans Serif', 'Display', 'Modern'], axis: 'wght@400;500;600;700', note: 'Round geometric, confident and approachable' },
  { family: 'Montserrat', fallback: 'sans-serif', categories: ['Sans Serif', 'Display'], axis: 'wght@400;500;600;700;800', note: 'Wide urban letterforms, strong headlines' },
  { family: 'Plus Jakarta Sans', fallback: 'sans-serif', categories: ['Sans Serif', 'Modern'], axis: 'wght@400;500;600;700;800', note: 'Crisp SaaS-style sans with personality' },
  { family: 'Space Grotesk', fallback: 'sans-serif', categories: ['Display', 'Modern'], axis: 'wght@400;500;600;700', note: 'Quirky grotesk, techy and experimental' },
  { family: 'Outfit', fallback: 'sans-serif', categories: ['Sans Serif', 'Display', 'Minimal'], axis: 'wght@400;500;600;700', note: 'Clean geometric with a playful rhythm' },
  { family: 'Sora', fallback: 'sans-serif', categories: ['Display', 'Modern'], axis: 'wght@400;500;600;700', note: 'Futuristic, built for screens' },
  { family: 'Lato', fallback: 'sans-serif', categories: ['Sans Serif', 'Minimal'], axis: 'wght@400;700;900', note: 'Warm humanist, easy long-form reading' },
  { family: 'Roboto', fallback: 'sans-serif', categories: ['Sans Serif', 'Minimal'], axis: 'wght@400;500;700', note: 'Familiar, mechanical, very readable' },
  { family: 'Playfair Display', fallback: 'serif', categories: ['Serif', 'Display', 'Editorial'], axis: 'wght@400;500;600;700', note: 'High-contrast, fashion-magazine elegance' },
  { family: 'Cormorant Garamond', fallback: 'serif', categories: ['Serif', 'Editorial', 'Display'], axis: 'wght@400;500;600;700', note: 'Refined Garamond for luxury brands' },
  { family: 'Merriweather', fallback: 'serif', categories: ['Serif', 'Editorial'], axis: 'wght@400;700;900', note: 'Sturdy serif made for reading on screen' },
]

export const FONT_FAMILIES = FONTS.map((f) => f.family)

export function fontStack(family: string | null | undefined) {
  if (!family) return undefined
  const def = FONTS.find((f) => f.family === family)
  return `"${family}", ${def?.fallback ?? 'sans-serif'}`
}

export const FONT_PAIRINGS: { name: string; heading: string; body: string; accent?: string }[] = [
  { name: 'Studio Clean', heading: 'Inter', body: 'Inter' },
  { name: 'Editorial Luxe', heading: 'Playfair Display', body: 'DM Sans' },
  { name: 'Quiet Luxury', heading: 'Cormorant Garamond', body: 'Manrope' },
  { name: 'Tech Forward', heading: 'Space Grotesk', body: 'Inter', accent: 'Sora' },
  { name: 'Startup Bold', heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans' },
  { name: 'Friendly Brand', heading: 'Poppins', body: 'Lato' },
  { name: 'Future Minimal', heading: 'Sora', body: 'DM Sans' },
  { name: 'Classic Journal', heading: 'Merriweather', body: 'Roboto' },
  { name: 'Urban Statement', heading: 'Montserrat', body: 'Outfit' },
]

let loaded = false
/** Loads every library font from Google Fonts once, in a single stylesheet request. */
export function loadAllFonts() {
  if (loaded || typeof document === 'undefined') return
  loaded = true
  const families = FONTS.map((f) => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:${f.axis}`).join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  link.dataset.idliFonts = 'true'
  document.head.appendChild(link)
}
