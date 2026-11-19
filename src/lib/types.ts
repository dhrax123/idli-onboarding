export type OnboardingStatus = 'not_started' | 'in_progress' | 'submitted' | 'in_review' | 'completed' | 'archived'
export type YesNoUnsure = 'yes' | 'no' | 'unsure'

export interface BusinessData {
  company_name: string
  about: string
  industry: string
  offerings: string
  target_audience: string
  differentiators: string
  has_website: 'yes' | 'no' | ''
  website_url: string
  social_links: string[]
}

export interface ProjectData {
  project_types: string[]
  other_type: string
  objective: string
  functionality: string
  integrations: string
  timeline: string
  launch_date: string
  expected_outcome: string
  budget_range: string
}

export interface BrandData {
  personalities: string[]
  notes: string
}

export interface FontCombo {
  heading: string
  body: string
  accent: string | null
}

export interface TypographyData {
  heading_font: string
  body_font: string
  accent_font: string | null
  saved_combinations: FontCombo[]
}

export interface ColourData {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  preset: string | null
}
export type ColourRole = 'primary' | 'secondary' | 'accent' | 'background' | 'text'

export interface LayoutData {
  navigation: string
  hero: string
  buttons: string
  cards: string
  sections: string
  images: string
  footer: string
  notes: string
}

export interface InspirationRef {
  url: string
  likes: string
  comment: string
}

export interface CompetitorRef {
  name: string
  url: string
  likes: string
  avoid: string
}

export interface CompetitorData {
  items: CompetitorRef[]
  notes: string
}

export interface TechnicalData {
  answers: Record<string, YesNoUnsure>
  domain_name: string
  hosting_provider: string
  integration_notes: string
  notes: string
}

export interface AssetRecord {
  id: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  category: 'logo' | 'brand_guidelines' | 'document' | 'image' | 'other'
  created_at: string
  storage_path?: string
}

/** Everything the client edits. Mirrors the payload returned by get_onboarding. */
export interface OnboardingData {
  business: BusinessData
  project: ProjectData
  brand: BrandData
  typography: TypographyData
  colours: ColourData
  layout: LayoutData
  inspiration: InspirationRef[]
  competitors: CompetitorData
  technical: TechnicalData
}

export interface SessionMeta {
  id: string
  project_name: string
  slug: string
  status: OnboardingStatus
  current_step: number
  progress: number
  welcome_message: string | null
  submitted_at: string | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
  // agency-only
  public_token?: string
  expires_at?: string | null
  first_opened_at?: string | null
  client_id?: string
}

export interface ClientMeta {
  company_name: string
  contact_name: string | null
  id?: string
  email?: string | null
  phone?: string | null
  industry?: string | null
  notes?: string | null
}

export interface OnboardingPayload extends OnboardingData {
  session: SessionMeta
  client: ClientMeta
  assets: AssetRecord[]
}

/** Shape used by the live preview engine. */
export interface DesignConfig {
  typography: TypographyData
  colours: ColourData
  layout: LayoutData
  brandName: string
  tagline?: string
}
