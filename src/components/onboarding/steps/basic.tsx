import { ArrowRight, Clock, Palette, Plus, Type, X, Layers } from 'lucide-react'
import { Button, Field, Input, Select, Textarea } from '@/components/ui'
import { BUDGETS, INDUSTRIES, PERSONALITIES, PROJECT_TYPES, TIMELINES } from '@/lib/options'
import { isLikelyUrl } from '@/lib/utils'
import { ChoiceCard, Pill, StepHeader, toggleIn, useOnb, YesNo } from '../shared'

/* ------------------------------ 01 Welcome ------------------------------ */
export function WelcomeStep() {
  const { payload, goTo, step, maxVisited } = useOnb()
  const resumed = maxVisited > 1 || payload.session.current_step > 0
  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-3xl flex-col justify-center py-10">
      <div className="animate-fade-up">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-[13px] text-muted">
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">For {payload.client.company_name}</span>
          {payload.session.project_name}
        </div>
        <h1 className="font-display text-[56px] leading-[0.98] tracking-[-0.01em] sm:text-[84px]">
          Let’s build something <em className="italic">remarkable.</em>
        </h1>
        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-2">
          {payload.session.welcome_message ||
            'Before we design anything, we want to understand your brand, your vision and what success looks like for you. This takes about 15 minutes, and you can play with fonts, colours and layouts along the way.'}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={() => goTo(resumed ? Math.max(step, payload.session.current_step, 1) : 1)}>
            {resumed ? 'Continue onboarding' : 'Start onboarding'} <ArrowRight />
          </Button>
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4" /> Saves automatically · come back anytime with this link
          </span>
        </div>
      </div>
      <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3" style={{ animationDelay: '120ms' }}>
        {[
          { icon: Layers, t: 'Discovery', d: 'Your business, audience and goals' },
          { icon: Type, t: 'Design studio', d: 'Try fonts, colours and layouts live' },
          { icon: Palette, t: 'Creative brief', d: 'Everything our team needs to begin' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex gap-3 bg-surface p-5">
            <Icon className="mt-0.5 size-4 text-muted" />
            <div>
              <div className="text-sm font-medium">{t}</div>
              <div className="mt-0.5 text-[13px] text-muted">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------- 02 Business discovery ------------------------ */
export function BusinessStep() {
  const { data, update } = useOnb()
  const b = data.business
  const set = (patch: Partial<typeof b>) => update('business', (prev) => ({ ...prev, ...patch }))
  const socials = b.social_links.length ? b.social_links : ['']

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader index={1} title="Tell us about your business" description="The more context you share, the less we have to guess. Short answers are perfectly fine." />
      <div className="flex flex-col gap-7">
        <Field label="What is your company or brand name?" htmlFor="company">
          <Input id="company" value={b.company_name} onChange={(e) => set({ company_name: e.target.value })} placeholder="e.g. Northbound Coffee" maxLength={160} />
        </Field>
        <Field label="Tell us about your business" htmlFor="about" hint="What you do, how long you’ve been doing it, and where you’re headed.">
          <Textarea id="about" value={b.about} onChange={(e) => set({ about: e.target.value })} rows={5} maxLength={5000} placeholder="We’re a specialty coffee roaster based in Bengaluru…" />
        </Field>
        <Field label="Which industry do you operate in?" htmlFor="industry">
          <Select id="industry" value={b.industry} onChange={(e) => set({ industry: e.target.value })}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </Select>
        </Field>
        <Field label="What products or services do you offer?" htmlFor="offerings">
          <Textarea id="offerings" value={b.offerings} onChange={(e) => set({ offerings: e.target.value })} rows={3} maxLength={5000} />
        </Field>
        <Field label="Who is your target audience?" htmlFor="audience" hint="Age, location, profession, what they care about, how they find you.">
          <Textarea id="audience" value={b.target_audience} onChange={(e) => set({ target_audience: e.target.value })} rows={3} maxLength={5000} />
        </Field>
        <Field label="What differentiates you from competitors?" htmlFor="diff">
          <Textarea id="diff" value={b.differentiators} onChange={(e) => set({ differentiators: e.target.value })} rows={3} maxLength={5000} />
        </Field>
        <Field label="Do you currently have a website?">
          <div><YesNo allowUnsure={false} value={b.has_website || undefined} onChange={(v) => set({ has_website: v as 'yes' | 'no' })} /></div>
        </Field>
        {b.has_website === 'yes' && (
          <Field label="Share your website URL" htmlFor="site">
            <Input id="site" inputMode="url" value={b.website_url} onChange={(e) => set({ website_url: e.target.value })} placeholder="yourbrand.com" aria-invalid={!isLikelyUrl(b.website_url)} />
            {!isLikelyUrl(b.website_url) && <p className="text-[13px] text-danger">That doesn’t look like a web address.</p>}
          </Field>
        )}
        <Field label="Share your social media links" optional>
          <div className="flex flex-col gap-2">
            {socials.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={s}
                  inputMode="url"
                  placeholder={['instagram.com/yourbrand', 'linkedin.com/company/yourbrand', 'x.com/yourbrand'][i % 3]}
                  onChange={(e) => set({ social_links: socials.map((v, j) => (j === i ? e.target.value : v)) })}
                />
                {socials.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => set({ social_links: socials.filter((_, j) => j !== i) })} aria-label="Remove link">
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {socials.length < 10 && (
              <Button variant="ghost" size="sm" className="self-start" onClick={() => set({ social_links: [...socials, ''] })}>
                <Plus /> Add another link
              </Button>
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}

/* ------------------------ 03 Project requirements ------------------------ */
export function ProjectStep() {
  const { data, update } = useOnb()
  const p = data.project
  const set = (patch: Partial<typeof p>) => update('project', (prev) => ({ ...prev, ...patch }))

  return (
    <div className="mx-auto max-w-3xl">
      <StepHeader index={2} title="What would you like us to build?" description="Pick everything that applies — many projects combine a few of these." />
      <div className="grid gap-3 sm:grid-cols-2">
        {PROJECT_TYPES.map((t) => (
          <ChoiceCard key={t.id} title={t.label} description={t.description} selected={p.project_types.includes(t.id)} onClick={() => set({ project_types: toggleIn(p.project_types, t.id) })} />
        ))}
      </div>
      {p.project_types.includes('other') && (
        <Field label="Tell us what you have in mind" className="mt-5">
          <Input value={p.other_type} onChange={(e) => set({ other_type: e.target.value })} maxLength={300} />
        </Field>
      )}

      <div className="mt-12 flex flex-col gap-7">
        <Field label="What is the primary objective of this project?" hint="e.g. Generate qualified leads, sell online, raise funding, look credible to enterprise buyers.">
          <Textarea value={p.objective} onChange={(e) => set({ objective: e.target.value })} rows={3} maxLength={5000} />
        </Field>
        <Field label="What functionality do you expect?" hint="Pages, features, user accounts, booking, payments, blog, multilingual…">
          <Textarea value={p.functionality} onChange={(e) => set({ functionality: e.target.value })} rows={4} maxLength={5000} />
        </Field>
        <Field label="Any integrations?" optional hint="Razorpay, Shopify, HubSpot, WhatsApp, Calendly, Zoho, Google Analytics…">
          <Textarea value={p.integrations} onChange={(e) => set({ integrations: e.target.value })} rows={2} maxLength={5000} />
        </Field>
        <Field label="What is your timeline?">
          <div className="flex flex-wrap gap-2">
            {TIMELINES.map((t) => <Pill key={t} selected={p.timeline === t} onClick={() => set({ timeline: p.timeline === t ? '' : t })}>{t}</Pill>)}
          </div>
        </Field>
        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Target launch date" optional>
            <Input type="date" value={p.launch_date} onChange={(e) => set({ launch_date: e.target.value })} />
          </Field>
          <Field label="Budget range" optional>
            <Select value={p.budget_range} onChange={(e) => set({ budget_range: e.target.value })}>
              <option value="">Prefer not to say</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="What outcome would make this project a success?" hint="Imagine it’s six months after launch. What has changed?">
          <Textarea value={p.expected_outcome} onChange={(e) => set({ expected_outcome: e.target.value })} rows={3} maxLength={5000} />
        </Field>
      </div>
    </div>
  )
}

/* -------------------------- 04 Brand personality ------------------------- */
export function BrandStep() {
  const { data, update } = useOnb()
  const br = data.brand
  return (
    <div className="mx-auto max-w-4xl">
      <StepHeader index={3} title="How should your brand feel?" description="Choose as many as feel right. We’ll use these to guide every design decision." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PERSONALITIES.map((p) => {
          const [bg, mid, fg] = p.swatch
          return (
            <ChoiceCard
              key={p.id}
              title={p.label}
              description={p.description}
              selected={br.personalities.includes(p.id)}
              onClick={() => update('brand', (prev) => ({ ...prev, personalities: toggleIn(prev.personalities, p.id) }))}
            >
              <div className="relative flex h-28 items-end overflow-hidden p-4" style={{ background: bg }}>
                <div className="absolute -right-6 -top-6 size-24 rounded-full opacity-90" style={{ background: mid }} />
                <span className="relative text-[32px] leading-none" style={{ fontFamily: `"${p.font}"`, color: fg, fontWeight: 600 }}>Aa</span>
              </div>
            </ChoiceCard>
          )
        })}
      </div>
      <Field label="Anything else about how your brand should feel?" optional className="mt-10 max-w-2xl" hint="Brands you love, words you’d use, words you’d never use.">
        <Textarea value={br.notes} onChange={(e) => update('brand', (prev) => ({ ...prev, notes: e.target.value }))} rows={3} maxLength={3000} />
      </Field>
    </div>
  )
}
