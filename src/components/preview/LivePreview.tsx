import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, Menu, Sparkles, Star, Zap, Shield } from 'lucide-react'
import { colourVars } from '@/lib/colour'
import { fontStack } from '@/lib/fonts'
import type { DesignConfig } from '@/lib/types'
import { cn } from '@/lib/utils'

export type PreviewDevice = 'desktop' | 'mobile'

const DESIGN_WIDTH: Record<PreviewDevice, number> = { desktop: 1280, mobile: 390 }

/**
 * The live preview engine. Every visual decision is driven by the central
 * DesignConfig: colours and fonts become CSS custom properties on the root,
 * layout choices switch component variants. Nothing is a screenshot.
 */
export function LivePreview({
  config,
  device,
  className,
  fit = 'width',
}: {
  config: DesignConfig
  device: PreviewDevice
  className?: string
  fit?: 'width' | 'none'
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [innerHeight, setInnerHeight] = useState(0)
  const width = DESIGN_WIDTH[device]

  useEffect(() => {
    if (fit === 'none') return
    const el = outer.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const available = el.clientWidth
      setScale(Math.min(1, available / width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, fit])

  useEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setInnerHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { typography: t, colours, layout } = config
  const style = {
    ...colourVars(colours),
    '--lp-font-heading': fontStack(t.heading_font),
    '--lp-font-body': fontStack(t.body_font),
    '--lp-font-accent': fontStack(t.accent_font || t.heading_font),
    '--lp-btn-radius': { rounded: '10px', pill: '999px', sharp: '0px', outline: '10px' }[layout.buttons] ?? '10px',
    '--lp-img-radius': { rounded: '18px', sharp: '0px', arch: '999px 999px 18px 18px', duotone: '18px' }[layout.images] ?? '18px',
    width,
  } as CSSProperties

  const mobile = device === 'mobile'

  return (
    <div ref={outer} className={cn('w-full', className)} style={{ height: fit === 'none' ? undefined : innerHeight * scale }}>
      <div
        ref={inner}
        data-img={layout.images}
        className="lp origin-top-left overflow-hidden"
        style={{ ...style, transform: fit === 'none' ? undefined : `scale(${scale})` }}
      >
        <Nav config={config} mobile={mobile} />
        <Hero config={config} mobile={mobile} />
        <Features config={config} mobile={mobile} />
        <ContentBlock mobile={mobile} />
        <Footer config={config} mobile={mobile} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Logo({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="lp-primary-bg grid place-items-center rounded-[8px]" style={{ width: size + 6, height: size + 6 }}>
        <span className="lp-heading font-bold" style={{ fontSize: size * 0.62 }}>
          {name.trim().charAt(0).toUpperCase() || 'B'}
        </span>
      </span>
      <span className="lp-heading font-semibold tracking-tight" style={{ fontSize: size * 0.9 }}>
        {name || 'Your Brand'}
      </span>
    </div>
  )
}

function Btn({ kind, style, children, big }: { kind: 'primary' | 'secondary'; style: string; children: ReactNode; big?: boolean }) {
  const base: CSSProperties = {
    borderRadius: 'var(--lp-btn-radius)',
    fontFamily: 'var(--lp-font-body)',
    padding: big ? '14px 26px' : '10px 18px',
    fontSize: big ? 16 : 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    border: '1.5px solid transparent',
  }
  if (kind === 'primary') {
    return style === 'outline' ? (
      <span style={{ ...base, borderColor: 'var(--lp-primary)', color: 'var(--lp-primary)', background: 'color-mix(in srgb, var(--lp-primary) 8%, transparent)' }}>{children}</span>
    ) : (
      <span className="lp-primary-bg" style={base}>{children}</span>
    )
  }
  return (
    <span className="lp-line" style={{ ...base, borderColor: 'color-mix(in srgb, var(--lp-text) 18%, transparent)', color: 'var(--lp-text)' }}>
      {children}
    </span>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="lp-accent-font inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--lp-accent)' }}>
      {children}
    </span>
  )
}

function Art({ variant = 0, className, style }: { variant?: number; className?: string; style?: CSSProperties }) {
  const shapes = [
    <>
      <div className="absolute -left-10 top-1/4 size-2/3 rounded-full" style={{ background: 'var(--lp-primary)', opacity: 0.9 }} />
      <div className="absolute bottom-[-20%] right-[-10%] size-3/4 rounded-full" style={{ background: 'var(--lp-accent)', opacity: 0.85 }} />
      <div className="absolute right-1/4 top-[12%] size-1/4 rounded-[30%]" style={{ background: 'var(--lp-secondary)' }} />
    </>,
    <>
      <div className="absolute inset-x-[12%] bottom-0 top-[22%] rounded-t-full" style={{ background: 'var(--lp-secondary)' }} />
      <div className="absolute left-[30%] top-[38%] size-[40%] rounded-full" style={{ background: 'var(--lp-primary)' }} />
    </>,
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--lp-primary), var(--lp-accent))', opacity: 0.85 }} />
      <div className="absolute left-[15%] top-[20%] h-[60%] w-[45%] rounded-[24px]" style={{ background: 'var(--lp-bg)', opacity: 0.9 }} />
    </>,
  ]
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ borderRadius: 'var(--lp-img-radius)', background: 'color-mix(in srgb, var(--lp-secondary) 45%, var(--lp-bg))', ...style }}
    >
      {shapes[variant % shapes.length]}
      <DuotoneOverlay />
    </div>
  )
}

function DuotoneOverlay() {
  return <div className="lp-duotone pointer-events-none absolute inset-0" />
}

/* ------------------------------ Nav ------------------------------- */
function Nav({ config, mobile }: { config: DesignConfig; mobile: boolean }) {
  const links = ['Work', 'Services', 'About', 'Journal']
  const variant = mobile ? (config.layout.navigation === 'pill' ? 'pill' : 'minimal') : config.layout.navigation
  const navText = { fontFamily: 'var(--lp-font-body)', fontSize: 15, fontWeight: 500 }

  if (variant === 'pill') {
    return (
      <div className={cn(mobile ? 'px-4 pt-4' : 'px-10 pt-6')}>
        <div className="lp-surface lp-line flex items-center justify-between rounded-full border py-2.5 pl-5 pr-2.5">
          <Logo name={config.brandName} size={mobile ? 18 : 20} />
          {!mobile && <div className="flex gap-8 lp-muted" style={navText}>{links.map((l) => <span key={l}>{l}</span>)}</div>}
          {mobile ? <Menu className="mr-2 size-5" /> : <Btn kind="primary" style={config.layout.buttons}>Get in touch</Btn>}
        </div>
      </div>
    )
  }
  if (variant === 'centered') {
    return (
      <div className="lp-line grid grid-cols-[1fr_auto_1fr] items-center border-b px-10 py-5">
        <div className="flex gap-7 lp-muted" style={navText}>{links.slice(0, 2).map((l) => <span key={l}>{l}</span>)}</div>
        <Logo name={config.brandName} size={22} />
        <div className="flex items-center justify-end gap-7 lp-muted" style={navText}>
          {links.slice(2).map((l) => <span key={l}>{l}</span>)}
          <span className="lp-primary font-semibold">Contact →</span>
        </div>
      </div>
    )
  }
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-between', mobile ? 'px-5 py-4' : 'px-10 py-6')}>
        <Logo name={config.brandName} size={mobile ? 18 : 20} />
        <div className="flex items-center gap-3" style={navText}>
          {!mobile && <span className="lp-muted">Menu</span>}
          <span className="lp-line grid size-10 place-items-center rounded-full border"><Menu className="size-4" /></span>
        </div>
      </div>
    )
  }
  return (
    <div className="lp-line flex items-center justify-between border-b px-10 py-5">
      <Logo name={config.brandName} />
      <div className="flex items-center gap-8">
        <div className="flex gap-8 lp-muted" style={navText}>{links.map((l) => <span key={l}>{l}</span>)}</div>
        <Btn kind="primary" style={config.layout.buttons}>Get started</Btn>
      </div>
    </div>
  )
}

/* ------------------------------ Hero ------------------------------ */
function Hero({ config, mobile }: { config: DesignConfig; mobile: boolean }) {
  const headline = config.tagline?.trim() || 'Thoughtfully crafted for people who notice the details'
  const sub = 'We combine strategy, design and technology to build digital experiences that feel effortless and perform beautifully.'
  const b = config.layout.buttons
  const ctas = (
    <div className={cn('flex flex-wrap gap-3', mobile && 'flex-col items-stretch [&>span]:justify-center')}>
      <Btn kind="primary" style={b} big={!mobile}>Start a project <ArrowRight size={16} /></Btn>
      <Btn kind="secondary" style={b} big={!mobile}>See our work</Btn>
    </div>
  )
  const eyebrow = <Eyebrow><Sparkles size={14} /> New collection · 2026</Eyebrow>
  const h1Size = mobile ? 38 : 68

  const variant = config.layout.hero
  if (variant === 'split' && !mobile) {
    return (
      <section className="grid grid-cols-[1.05fr_1fr] items-center gap-14 px-10 py-20">
        <div className="flex flex-col gap-6">
          {eyebrow}
          <h1 className="font-semibold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: 60 }}>{headline}</h1>
          <p className="lp-muted max-w-[520px] text-[18px] leading-relaxed">{sub}</p>
          {ctas}
        </div>
        <Art variant={0} className="aspect-[4/3.4] w-full" />
      </section>
    )
  }
  if (variant === 'fullbleed') {
    return (
      <section className={cn(mobile ? 'px-4 pt-2' : 'px-10 pt-4')}>
        <div className="relative overflow-hidden" style={{ borderRadius: 'var(--lp-img-radius)' }}>
          <Art variant={2} className={cn('w-full', mobile ? 'h-[520px]' : 'h-[600px]')} style={{ borderRadius: 0 }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--lp-text) 82%, transparent), transparent 70%)' }} />
          <div className={cn('absolute inset-x-0 bottom-0 flex flex-col gap-5', mobile ? 'p-6' : 'max-w-[820px] p-14')} style={{ color: 'var(--lp-bg)' }}>
            <span className="lp-accent-font text-[13px] font-semibold uppercase tracking-[0.14em] opacity-90">New collection · 2026</span>
            <h1 className="font-semibold leading-[1.04] tracking-[-0.02em]" style={{ fontSize: h1Size - 4 }}>{headline}</h1>
            <p className="max-w-[560px] text-[17px] leading-relaxed opacity-85">{sub}</p>
            {ctas}
          </div>
        </div>
      </section>
    )
  }
  if (variant === 'editorial') {
    return (
      <section className={cn('flex flex-col', mobile ? 'gap-6 px-5 py-10' : 'gap-10 px-10 pb-16 pt-20')}>
        <div className={cn('flex', mobile ? 'flex-col gap-5' : 'items-end justify-between gap-16')}>
          <h1 className="max-w-[900px] font-semibold leading-[0.98] tracking-[-0.03em]" style={{ fontSize: mobile ? 44 : 92 }}>{headline}</h1>
          <div className={cn('flex flex-col gap-5', !mobile && 'max-w-[300px] pb-3')}>
            <p className="lp-muted text-[16px] leading-relaxed">{sub}</p>
            <span className="lp-primary inline-flex items-center gap-1.5 font-semibold" style={{ fontSize: 15 }}>Explore the studio <ArrowUpRight size={16} /></span>
          </div>
        </div>
        <Art variant={1} className={cn('w-full', mobile ? 'h-[240px]' : 'h-[420px]')} />
      </section>
    )
  }
  // centered (and split on mobile)
  return (
    <section className={cn('flex flex-col items-center text-center', mobile ? 'gap-5 px-5 py-12' : 'gap-7 px-10 pb-16 pt-24')}>
      {eyebrow}
      <h1 className="max-w-[900px] font-semibold leading-[1.04] tracking-[-0.025em]" style={{ fontSize: h1Size }}>{headline}</h1>
      <p className="lp-muted max-w-[600px] leading-relaxed" style={{ fontSize: mobile ? 16 : 19 }}>{sub}</p>
      {ctas}
      <Art variant={variant === 'split' ? 0 : 2} className={cn('w-full', mobile ? 'mt-4 h-[220px]' : 'mt-10 h-[420px]')} />
    </section>
  )
}

/* ---------------------------- Features ---------------------------- */
const FEATURES = [
  { icon: Zap, title: 'Fast by default', body: 'Performance-first builds that load instantly on every device.' },
  { icon: Shield, title: 'Built to last', body: 'Considered systems that grow with your business, not against it.' },
  { icon: Star, title: 'Memorable design', body: 'A visual identity your audience recognises at a glance.' },
  { icon: Check, title: 'Effortless editing', body: 'Update content yourself without calling a developer.' },
]

function cardStyle(kind: string): { className: string; style: CSSProperties } {
  switch (kind) {
    case 'elevated':
      return { className: 'p-7', style: { background: 'var(--lp-bg)', borderRadius: 18, boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 12px 32px -12px rgba(0,0,0,0.18)' } }
    case 'filled':
      return { className: 'lp-surface p-7', style: { borderRadius: 18, background: 'color-mix(in srgb, var(--lp-secondary) 35%, var(--lp-bg))' } }
    case 'minimal':
      return { className: 'pt-6', style: { borderTop: '2px solid var(--lp-text)', borderRadius: 0 } }
    default:
      return { className: 'lp-line border p-7', style: { borderRadius: 16 } }
  }
}

function FeatureCard({ f, kind, big }: { f: (typeof FEATURES)[number]; kind: string; big?: boolean }) {
  const cs = cardStyle(kind)
  const Icon = f.icon
  return (
    <div className={cn('flex h-full flex-col gap-4', cs.className)} style={cs.style}>
      <span className="lp-accent-bg grid size-11 place-items-center" style={{ borderRadius: 12 }}><Icon size={20} /></span>
      <h3 className="font-semibold tracking-tight" style={{ fontSize: big ? 26 : 20 }}>{f.title}</h3>
      <p className="lp-muted leading-relaxed" style={{ fontSize: 15 }}>{f.body}</p>
      <span className="lp-primary mt-auto inline-flex items-center gap-1 pt-2 font-semibold" style={{ fontSize: 14 }}>Learn more <ArrowRight size={14} /></span>
    </div>
  )
}

function Features({ config, mobile }: { config: DesignConfig; mobile: boolean }) {
  const { cards, sections } = config.layout
  const header = (
    <div className={cn('flex flex-col gap-3', mobile ? 'mb-8' : 'mb-12 max-w-[640px]')}>
      <Eyebrow>What we do</Eyebrow>
      <h2 className="font-semibold leading-[1.1] tracking-[-0.02em]" style={{ fontSize: mobile ? 30 : 44 }}>Everything you need to launch with confidence</h2>
      <p className="lp-muted leading-relaxed" style={{ fontSize: mobile ? 15 : 17 }}>A complete toolkit, shaped around how your customers actually think and buy.</p>
    </div>
  )
  const pad = mobile ? 'px-5 py-12' : 'px-10 py-20'

  if (sections === 'alternating') {
    return (
      <section className={pad}>
        {header}
        <div className="flex flex-col gap-14">
          {FEATURES.slice(0, 2).map((f, i) => (
            <div key={f.title} className={cn('grid items-center gap-8', mobile ? 'grid-cols-1' : 'grid-cols-2 gap-16')}>
              <Art variant={i + 1} className={cn('w-full', mobile ? 'h-[200px]' : 'h-[320px]', !mobile && i % 2 === 1 && 'order-2')} />
              <div className="flex flex-col gap-4">
                <span className="lp-accent-font lp-accent text-[15px] font-semibold">0{i + 1}</span>
                <h3 className="font-semibold tracking-tight" style={{ fontSize: mobile ? 24 : 34 }}>{f.title}</h3>
                <p className="lp-muted leading-relaxed" style={{ fontSize: 16 }}>{f.body} Designed and engineered in close collaboration with your team.</p>
                <div><Btn kind="primary" style={config.layout.buttons}>Discover more</Btn></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }
  if (sections === 'list') {
    return (
      <section className={pad}>
        {header}
        <div className="lp-line flex flex-col border-t">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={cn('lp-line flex border-b py-6', mobile ? 'flex-col gap-2' : 'items-center gap-10')}>
              <span className="lp-accent-font lp-muted w-12 text-[15px]">0{i + 1}</span>
              <h3 className="font-semibold tracking-tight" style={{ fontSize: mobile ? 20 : 26, minWidth: mobile ? 0 : 320 }}>{f.title}</h3>
              <p className="lp-muted flex-1 leading-relaxed" style={{ fontSize: 15 }}>{f.body}</p>
              {!mobile && <ArrowUpRight className="lp-primary" size={22} />}
            </div>
          ))}
        </div>
      </section>
    )
  }
  if (sections === 'bento' && !mobile) {
    return (
      <section className={pad}>
        {header}
        <div className="grid grid-cols-3 grid-rows-2 gap-5" style={{ height: 560 }}>
          <div className="col-span-2 row-span-1"><FeatureCard f={FEATURES[0]} kind={cards} big /></div>
          <div className="row-span-2"><Art variant={1} className="h-full w-full" /></div>
          <FeatureCard f={FEATURES[1]} kind={cards} />
          <FeatureCard f={FEATURES[2]} kind={cards} />
        </div>
      </section>
    )
  }
  return (
    <section className={pad}>
      {header}
      <div className={cn('grid gap-5', mobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {FEATURES.slice(0, 3).map((f) => <FeatureCard key={f.title} f={f} kind={cards} />)}
      </div>
    </section>
  )
}

/* ---------------------------- Content ----------------------------- */
function ContentBlock({ mobile }: { mobile: boolean }) {
  return (
    <section className={cn(mobile ? 'px-5 pb-12' : 'px-10 pb-20')}>
      <div className={cn('lp-secondary-bg grid gap-10', mobile ? 'grid-cols-1 p-7' : 'grid-cols-[1.2fr_1fr] p-14')} style={{ borderRadius: 24 }}>
        <div className="flex flex-col gap-5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] opacity-75 lp-accent-font">Client story</span>
          <p className="lp-heading leading-[1.25] tracking-tight" style={{ fontSize: mobile ? 22 : 32 }}>
            “They understood our brand better than we did. The new site doubled our enquiries in the first month.”
          </p>
          <div className="flex items-center gap-3">
            <span className="lp-primary-bg grid size-11 place-items-center rounded-full font-semibold">AR</span>
            <div style={{ fontSize: 14 }}>
              <div className="font-semibold">Ananya Rao</div>
              <div className="opacity-70">Founder, Northbound</div>
            </div>
          </div>
        </div>
        <div className={cn('grid grid-cols-2 gap-6', !mobile && 'content-center')}>
          {[['2.4×', 'More enquiries'], ['98', 'Performance score'], ['36%', 'Lower bounce rate'], ['6 wks', 'Idea to launch']].map(([n, l]) => (
            <div key={l} className="flex flex-col gap-1">
              <span className="lp-accent-font font-semibold tracking-tight" style={{ fontSize: mobile ? 30 : 42 }}>{n}</span>
              <span className="opacity-75" style={{ fontSize: 14 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="lp-muted mx-auto mt-10 max-w-[720px] text-center leading-relaxed" style={{ fontSize: mobile ? 15 : 17 }}>
        Long-form copy uses your body font. Here’s how a paragraph reads with <a className="lp-link">an inline link</a>, at a
        comfortable reading size and line height, so you can judge legibility for blog posts, case studies and policies.
      </p>
    </section>
  )
}

/* ----------------------------- Footer ----------------------------- */
function Footer({ config, mobile }: { config: DesignConfig; mobile: boolean }) {
  const year = new Date().getFullYear()
  const v = config.layout.footer
  const legal = (
    <div className="lp-muted flex flex-wrap justify-between gap-3" style={{ fontSize: 13 }}>
      <span>© {year} {config.brandName || 'Your Brand'}. All rights reserved.</span>
      <span className="flex gap-5"><span>Privacy</span><span>Terms</span></span>
    </div>
  )
  if (v === 'minimal') {
    return (
      <footer className={cn('lp-line flex items-center justify-between border-t', mobile ? 'flex-col gap-4 px-5 py-8' : 'px-10 py-8')}>
        <Logo name={config.brandName} size={16} />
        <span className="lp-muted" style={{ fontSize: 13 }}>© {year} {config.brandName || 'Your Brand'}</span>
      </footer>
    )
  }
  if (v === 'simple') {
    return (
      <footer className={cn('lp-line flex border-t', mobile ? 'flex-col gap-5 px-5 py-8' : 'items-center justify-between px-10 py-8')}>
        <Logo name={config.brandName} size={18} />
        <div className="lp-muted flex flex-wrap gap-6" style={{ fontSize: 14 }}>{['Work', 'Services', 'About', 'Contact', 'Instagram'].map((l) => <span key={l}>{l}</span>)}</div>
      </footer>
    )
  }
  if (v === 'cta') {
    return (
      <footer className={cn(mobile ? 'px-5 pb-8' : 'px-10 pb-10')}>
        <div className={cn('lp-primary-bg flex flex-col', mobile ? 'gap-6 p-7' : 'gap-8 p-16')} style={{ borderRadius: 28 }}>
          <h2 className="font-semibold leading-[1.02] tracking-[-0.03em]" style={{ fontSize: mobile ? 36 : 76 }}>Let’s build something remarkable.</h2>
          <div className={cn('flex', mobile ? 'flex-col gap-4' : 'items-center justify-between')}>
            <span style={{ fontSize: 16, opacity: 0.85 }}>hello@{(config.brandName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
            <span className="inline-flex items-center gap-2 font-semibold" style={{ borderRadius: 'var(--lp-btn-radius)', background: 'var(--lp-on-primary)', color: 'var(--lp-primary)', padding: '14px 24px', fontSize: 15 }}>
              Book a call <ArrowRight size={16} />
            </span>
          </div>
        </div>
        <div className="mt-8">{legal}</div>
      </footer>
    )
  }
  return (
    <footer className={cn('lp-line border-t', mobile ? 'px-5 py-10' : 'px-10 py-14')}>
      <div className={cn('grid gap-10', mobile ? 'grid-cols-2' : 'grid-cols-[1.6fr_1fr_1fr_1.4fr]')}>
        <div className={cn('flex flex-col gap-4', mobile && 'col-span-2')}>
          <Logo name={config.brandName} />
          <p className="lp-muted max-w-[280px] leading-relaxed" style={{ fontSize: 14 }}>Digital experiences for ambitious brands.</p>
        </div>
        {[['Company', ['About', 'Careers', 'Press']], ['Explore', ['Work', 'Services', 'Journal']]].map(([h, items]) => (
          <div key={h as string} className="flex flex-col gap-3" style={{ fontSize: 14 }}>
            <span className="font-semibold">{h as string}</span>
            {(items as string[]).map((i) => <span key={i} className="lp-muted">{i}</span>)}
          </div>
        ))}
        <div className={cn('flex flex-col gap-3', mobile && 'col-span-2')}>
          <span className="font-semibold" style={{ fontSize: 14 }}>Newsletter</span>
          <div className="lp-line flex items-center justify-between border py-1.5 pl-4 pr-1.5" style={{ borderRadius: 'var(--lp-btn-radius)' }}>
            <span className="lp-muted" style={{ fontSize: 14 }}>you@email.com</span>
            <Btn kind="primary" style={config.layout.buttons}>Join</Btn>
          </div>
        </div>
      </div>
      <div className="lp-line mt-12 border-t pt-6">{legal}</div>
    </footer>
  )
}
