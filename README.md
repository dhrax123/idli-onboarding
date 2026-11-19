# Idli Studios · Client Onboarding & Design Studio

A personalised onboarding portal for Idli Studios clients. Each client gets a private link where they answer discovery questions and try out fonts, colours and layouts on a live website preview. The team gets a dashboard with every submission, internal comments and a PDF creative brief to export.

**Stack:** React 19 + TypeScript (Vite) · Tailwind CSS v4 · shadcn-style components (Radix) · Supabase (Postgres, Auth, Storage) · Google Fonts · Vercel

---

## What's inside

### Client portal: `/onboarding/:company-slug/:token`
No account needed. The 24-character token (144 random bits) is the only key.

| # | Step | Notes |
|---|------|-------|
| 00 | Welcome | Company + project name, optional personal welcome message |
| 01 | Business discovery | All 9 questions, URL validation, multiple social links |
| 02 | Project requirements | 8 project types (multi-select), objective, functionality, integrations, timeline, launch date, budget, outcome |
| 03 | Brand personality | 8 visual cards, multi-select |
| 04 | **Typography studio** | Searchable library of the 14 fonts, 6 categories, heading / body / optional accent, curated pairings, shortlist + side-by-side compare |
| 05 | **Colour studio** | 5 roles, colour picker, editable HEX, RGB inputs, system picker, 8 presets, reset, WCAG contrast checks |
| 06 | **Layout studio** | Navigation, hero, buttons, cards, sections, images, footer, each option with a visual thumbnail |
| 07 | Inspiration | 3–5+ sites with likes and comments |
| 08 | Competitors | Name, URL, what they do well, what to avoid |
| 09 | Technical | 11 yes / no / not-sure questions with follow-ups, plus drag-and-drop uploads (25 MB each, max 50 files) |
| 10 | Review & submit | Full summary with Edit links, required-field check, confirmation screen |

- **Autosave:** saves 900 ms after each change and on every step change, and flushes when the tab is hidden. A header indicator shows Saving / Saved / Retry.
- **Resume:** reopening the link continues from the last step.
- **Lock:** after submission the answers are read-only. The agency can unlock by setting the status back to *In progress*.

### Live preview engine (`src/components/preview/LivePreview.tsx`)
This is a real mini website, not a screenshot: nav, hero, headline, subheading, primary and secondary CTAs, feature cards, a content section with testimonial and stats, long-form paragraph with a link, and a footer.

- Everything comes from one `DesignConfig` object (`typography`, `colours`, `layout`, `brandName`).
- Colours and fonts become CSS custom properties (`--lp-primary`, `--lp-font-heading`, …) on the preview root, so any change repaints instantly. Text on primary, secondary and accent colours automatically switches to black or white for legibility.
- Layout choices switch component variants: 4 navs, 4 heroes, 4 button styles, 4 card styles, 4 section layouts, 4 image treatments and 4 footers.
- Desktop (1280 px, scaled to fit) and mobile (390 px) modes, plus a full-screen view. On phones the preview opens in a bottom sheet.

### Agency dashboard: `/dashboard` (Supabase Auth)
- Stats: total clients, pending, completed, submitted this week. A banner lists new briefs waiting for review.
- Sessions table with status filters, search, progress, last activity, copy link and open client view.
- **New onboarding:** creates the client and a unique link, with copy, WhatsApp and email share buttons that use a pre-written message.
- **Client profile:** all 12 brief sections; live preview of the client's choices; copy font names, copy single HEX codes or all of them; open or download single assets; **download all assets as a ZIP**; **export a structured PDF brief** (cover page, every section, colour swatches with HEX and RGB, asset list); internal comments; status; link expiry; regenerate link; archive; delete (removes the stored files too).
- `/playground`: an in-memory studio for sales calls. A banner says that nothing in it is saved.

---

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor:** paste and run `supabase/migrations/20261119000000_onboarding_schema.sql`. Or, with the CLI: `supabase link` then `supabase db push`.
3. **Authentication → Providers → Email:** turn **off** "Allow new users to sign up". This is required: every Auth user becomes a team member.
4. **Authentication → Users → Invite user:** invite each team member. The **first user becomes `admin`** and later users are `member`.
5. **Authentication → URL Configuration:** set the Site URL to your domain and add `https://<domain>/dashboard` to the redirect URLs (used by magic links).

The migration creates the private `client-assets` storage bucket, its policies, a 25 MB limit and the allowed file types.

### 2. Environment variables
```bash
cp .env.example .env.local
```
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_PUBLIC_APP_URL=https://idlistudios.com   # base for generated client links
```
Without these variables the app shows a "Backend not configured" screen. It does **not** fall back to fake data. `/playground` still works.

### 3. Run locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
Import the repo, keep the Vite framework preset, add the three env vars, and deploy. `vercel.json` already handles SPA routing and security headers. To serve links at `idlistudios.com/onboarding/...`, point that domain (or a rewrite from the main site) at this deployment.

---

## Database & security

```
auth.users ─1:1─ agency_users
clients ─1:n─ onboarding_sessions ─1:1─ business_responses
                                  ├─1:1─ project_requirements
                                  ├─1:1─ design_preferences      (brand personality, competitor notes)
                                  ├─1:1─ typography_selections
                                  ├─1:1─ colour_selections       (HEX CHECK-constrained)
                                  ├─1:1─ layout_preferences
                                  ├─1:1─ technical_requirements
                                  ├─1:n─ website_references      (kind: inspiration | competitor)
                                  ├─1:n─ uploaded_assets
                                  └─1:n─ internal_comments
```

- **Agency:** RLS on every table. Only users in `agency_users` can read or write. Comments can only be written as yourself.
- **Clients (anon):** no table access at all. Clients can only call `SECURITY DEFINER` functions (`get_onboarding`, `save_onboarding`, `submit_onboarding`, `register_asset`, `remove_asset`). Each function resolves exactly one session from the token, checks that the session is not archived, expired or already submitted, and validates and length-limits every field. The client payload never includes the token, internal notes, contact details or storage paths.
- **Uploads:** anon may only *insert* into `client-assets/<valid-active-token>/…`. Anon cannot list, read or delete any object, so clients cannot see each other's files. `register_asset` checks that the object really exists under that same token. Team members read files through 10-minute signed URLs.
- Status `archived` or a past `expires_at` immediately disables a link. *Generate new link* rotates the token.
- `supabase/tests/security_test.sql` (run with `supabase_stub.sql` on plain Postgres 16) covers: anon blocked from tables and agency functions, cross-session isolation, bad tokens, upload path enforcement, submission validation, the post-submit lock, comment spoofing, and outsiders who are signed in but not team members. All checks pass.

> Files that a client removes before submitting stay private in storage. They are deleted along with the session when the session is deleted from the dashboard.

## Project structure
```
src/
  components/
    preview/        LivePreview (engine), PreviewPanel (frame, device toggle, fullscreen)
    onboarding/     StudioLayout, LayoutThumb, shared UI, steps/*
    brief/          BriefSummary (used by client review + agency profile)
    dashboard/      DashboardLayout, NewSessionDialog
    ui/             Button, Input, Select, Badge, Segmented, Dialog…
  hooks/            useOnboarding (load, autosave, submit), useAuth
  lib/              supabase, onboarding-api, agency-api, pdf, fonts, colour, options, steps, types
  pages/            OnboardingPage, LoginPage, DashboardHome, SessionDetail, PlaygroundPage
supabase/
  migrations/       schema, RLS, RPCs, storage
  tests/            security test suite
```
