import type { LayoutData, OnboardingData } from './types'
import { DEFAULT_COLOURS } from './colour'

export const INDUSTRIES = [
  'Technology & SaaS', 'E-commerce & Retail', 'Food & Beverage', 'Fashion & Apparel', 'Health & Wellness',
  'Finance & Fintech', 'Real Estate', 'Education', 'Hospitality & Travel', 'Media & Entertainment',
  'Gaming & Esports', 'Professional Services', 'Manufacturing', 'Non-profit', 'Other',
]

export const PROJECT_TYPES: { id: string; label: string; description: string }[] = [
  { id: 'corporate', label: 'Corporate website', description: 'Company presence, services, team, contact' },
  { id: 'ecommerce', label: 'E-commerce website', description: 'Catalogue, cart, checkout, payments' },
  { id: 'landing', label: 'Landing page', description: 'One focused page for a launch or campaign' },
  { id: 'webapp', label: 'Web application', description: 'Logged-in tool with custom workflows' },
  { id: 'saas', label: 'SaaS platform', description: 'Product, pricing, onboarding, dashboard' },
  { id: 'portfolio', label: 'Portfolio website', description: 'Showcase work, case studies, about' },
  { id: 'redesign', label: 'Website redesign', description: 'Rethink an existing site' },
  { id: 'other', label: 'Other', description: 'Something else — tell us below' },
]

export const TIMELINES = ['As soon as possible', 'Within 2–4 weeks', 'Within 1–2 months', 'Within 3 months', 'Flexible']
export const BUDGETS = ['Under ₹50k', '₹50k – ₹1.5L', '₹1.5L – ₹4L', '₹4L – ₹10L', '₹10L+', 'Not sure yet']

export const PERSONALITIES: { id: string; label: string; description: string; swatch: string[]; font: string }[] = [
  { id: 'minimal', label: 'Minimal and clean', description: 'Whitespace, restraint, clarity', swatch: ['#FFFFFF', '#E5E5E5', '#111111'], font: 'Inter' },
  { id: 'futuristic', label: 'Modern and futuristic', description: 'Sharp, forward, digital-native', swatch: ['#0B1020', '#6366F1', '#22D3EE'], font: 'Sora' },
  { id: 'premium', label: 'Premium and luxurious', description: 'Quiet confidence, fine details', swatch: ['#141210', '#B08D57', '#FAF7F2'], font: 'Cormorant Garamond' },
  { id: 'bold', label: 'Bold and experimental', description: 'Big type, unexpected layouts', swatch: ['#E11D48', '#FDE047', '#111111'], font: 'Space Grotesk' },
  { id: 'playful', label: 'Playful and creative', description: 'Colour, warmth, personality', swatch: ['#F472B6', '#FDBA74', '#7C3AED'], font: 'Poppins' },
  { id: 'corporate', label: 'Corporate and professional', description: 'Trustworthy, structured, clear', swatch: ['#1D4ED8', '#E2E8F0', '#0F172A'], font: 'Roboto' },
  { id: 'editorial', label: 'Editorial and elegant', description: 'Magazine-like rhythm and serifs', swatch: ['#FBF7F0', '#2B2118', '#9A3412'], font: 'Playfair Display' },
  { id: 'tech', label: 'Tech-focused and innovative', description: 'Precise, product-led, sharp', swatch: ['#0F172A', '#10B981', '#F8FAFC'], font: 'Space Grotesk' },
]

export interface LayoutOption { id: string; label: string; description: string }
export interface LayoutGroup { key: Exclude<keyof LayoutData, 'notes'>; label: string; question: string; options: LayoutOption[] }

export const LAYOUT_GROUPS: LayoutGroup[] = [
  { key: 'navigation', label: 'Navigation', question: 'How should people move around the site?', options: [
    { id: 'classic', label: 'Classic', description: 'Logo left, links right' },
    { id: 'centered', label: 'Centered', description: 'Logo centred, links split' },
    { id: 'pill', label: 'Floating pill', description: 'Detached, rounded bar' },
    { id: 'minimal', label: 'Minimal menu', description: 'Logo + menu button' },
  ] },
  { key: 'hero', label: 'Hero section', question: 'What should visitors see first?', options: [
    { id: 'centered', label: 'Centered', description: 'Headline and CTAs centred' },
    { id: 'split', label: 'Split', description: 'Copy left, visual right' },
    { id: 'fullbleed', label: 'Full-bleed image', description: 'Text over a large visual' },
    { id: 'editorial', label: 'Editorial', description: 'Oversized type, image below' },
  ] },
  { key: 'buttons', label: 'Buttons', question: 'Which button shape fits your brand?', options: [
    { id: 'rounded', label: 'Rounded', description: 'Soft 10px corners' },
    { id: 'pill', label: 'Pill', description: 'Fully rounded' },
    { id: 'sharp', label: 'Sharp', description: 'Square corners' },
    { id: 'outline', label: 'Outline', description: 'Bordered, light fill' },
  ] },
  { key: 'cards', label: 'Cards', question: 'How should content blocks look?', options: [
    { id: 'bordered', label: 'Bordered', description: 'Fine outline' },
    { id: 'elevated', label: 'Elevated', description: 'Soft shadow' },
    { id: 'filled', label: 'Filled', description: 'Tinted surface' },
    { id: 'minimal', label: 'Minimal', description: 'No container, top rule' },
  ] },
  { key: 'sections', label: 'Section layout', question: 'How should features be arranged?', options: [
    { id: 'grid', label: 'Grid', description: 'Three even columns' },
    { id: 'bento', label: 'Bento', description: 'Mixed-size tiles' },
    { id: 'alternating', label: 'Alternating', description: 'Zig-zag image + text' },
    { id: 'list', label: 'List', description: 'Stacked rows' },
  ] },
  { key: 'images', label: 'Image treatment', question: 'How should imagery be framed?', options: [
    { id: 'rounded', label: 'Rounded', description: 'Soft corners' },
    { id: 'sharp', label: 'Sharp', description: 'Square edges' },
    { id: 'arch', label: 'Arch', description: 'Arched top mask' },
    { id: 'duotone', label: 'Duotone', description: 'Tinted with brand colour' },
  ] },
  { key: 'footer', label: 'Footer', question: 'How should the page end?', options: [
    { id: 'columns', label: 'Columns', description: 'Link columns + newsletter' },
    { id: 'cta', label: 'Big CTA', description: 'Large call to action' },
    { id: 'simple', label: 'Simple', description: 'One line with links' },
    { id: 'minimal', label: 'Minimal', description: 'Logo and copyright' },
  ] },
]

export const DEFAULT_LAYOUT: LayoutData = {
  navigation: 'classic', hero: 'centered', buttons: 'rounded', cards: 'bordered',
  sections: 'grid', images: 'rounded', footer: 'columns', notes: '',
}

export const TECH_QUESTIONS: { key: string; label: string; detail?: 'domain_name' | 'hosting_provider' | 'integration_notes' }[] = [
  { key: 'own_domain', label: 'Do you own a domain?', detail: 'domain_name' },
  { key: 'hosting', label: 'Do you have hosting?', detail: 'hosting_provider' },
  { key: 'logo', label: 'Do you have a logo?' },
  { key: 'brand_guidelines', label: 'Do you have existing brand guidelines?' },
  { key: 'content_ready', label: 'Is your website content ready?' },
  { key: 'copywriting', label: 'Do you require copywriting?' },
  { key: 'seo', label: 'Do you require SEO?' },
  { key: 'analytics', label: 'Do you require analytics?' },
  { key: 'third_party', label: 'Do you require third-party integrations?', detail: 'integration_notes' },
  { key: 'admin_dashboard', label: 'Do you require an admin dashboard?' },
  { key: 'maintenance', label: 'Do you require ongoing maintenance?' },
]

export const ASSET_CATEGORIES = [
  { id: 'logo', label: 'Logo' },
  { id: 'brand_guidelines', label: 'Brand guidelines' },
  { id: 'document', label: 'Document' },
  { id: 'image', label: 'Image / reference' },
  { id: 'other', label: 'Other' },
] as const

export function emptyOnboardingData(companyName = ''): OnboardingData {
  return {
    business: { company_name: companyName, about: '', industry: '', offerings: '', target_audience: '', differentiators: '', has_website: '', website_url: '', social_links: [''] },
    project: { project_types: [], other_type: '', objective: '', functionality: '', integrations: '', timeline: '', launch_date: '', expected_outcome: '', budget_range: '' },
    brand: { personalities: [], notes: '' },
    typography: { heading_font: 'Inter', body_font: 'Inter', accent_font: null, saved_combinations: [] },
    colours: { ...DEFAULT_COLOURS },
    layout: { ...DEFAULT_LAYOUT },
    inspiration: [{ url: '', likes: '', comment: '' }, { url: '', likes: '', comment: '' }, { url: '', likes: '', comment: '' }],
    competitors: { items: [{ name: '', url: '', likes: '', avoid: '' }], notes: '' },
    technical: { answers: {}, domain_name: '', hosting_provider: '', integration_notes: '', notes: '' },
  }
}

export const labelFor = {
  projectType: (id: string) => PROJECT_TYPES.find((p) => p.id === id)?.label ?? id,
  personality: (id: string) => PERSONALITIES.find((p) => p.id === id)?.label ?? id,
  layout: (group: string, id: string) =>
    LAYOUT_GROUPS.find((g) => g.key === group)?.options.find((o) => o.id === id)?.label ?? (id || '—'),
}
