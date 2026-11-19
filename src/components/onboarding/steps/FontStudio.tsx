import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Check, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import { FONT_CATEGORIES, FONT_PAIRINGS, FONTS, fontStack, loadAllFonts, type FontCategory } from '@/lib/fonts'
import type { FontCombo, TypographyData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StepHeader, useOnb } from '../shared'
import { StudioLayout } from '../StudioLayout'

type Role = 'heading' | 'body' | 'accent'
const ROLE_KEY: Record<Role, keyof TypographyData> = { heading: 'heading_font', body: 'body_font', accent: 'accent_font' }

const sameCombo = (a: FontCombo, b: FontCombo) => a.heading === b.heading && a.body === b.body && (a.accent ?? null) === (b.accent ?? null)

export function FontStudioStep() {
  const { data, update } = useOnb()
  const t = data.typography
  const [role, setRole] = useState<Role>('heading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FontCategory | 'All'>('All')
  const [compare, setCompare] = useState(false)

  useEffect(() => loadAllFonts(), [])

  const setTypo = (patch: Partial<TypographyData>) => update('typography', (prev) => ({ ...prev, ...patch }))
  const current: FontCombo = { heading: t.heading_font, body: t.body_font, accent: t.accent_font }
  const isSaved = t.saved_combinations.some((c) => sameCombo(c, current))

  const list = useMemo(
    () =>
      FONTS.filter(
        (f) =>
          (category === 'All' || f.categories.includes(category)) &&
          f.family.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [category, query],
  )

  const activeFont = role === 'accent' ? t.accent_font : (t[ROLE_KEY[role]] as string)

  const controls = (
    <div className="flex flex-col gap-6">
      {/* Current selection */}
      <div className="grid grid-cols-3 gap-2">
        {(['heading', 'body', 'accent'] as Role[]).map((r) => {
          const fam = r === 'accent' ? t.accent_font : (t[ROLE_KEY[r]] as string)
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border bg-surface p-3 text-left transition-all',
                role === r ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong',
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{r}{r === 'accent' && ' · optional'}</span>
              <span className="w-full truncate text-[15px] font-medium" style={{ fontFamily: fontStack(fam ?? undefined) }}>
                {fam ?? 'None'}
              </span>
            </button>
          )
        })}
      </div>

      <p className="-mt-3 text-[13px] text-muted">
        Choosing the <b className="font-medium text-ink">{role}</b> font. Tap any font below to apply it instantly.
      </p>

      {/* Search + categories */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fonts" className="pl-10" aria-label="Search fonts" />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink" aria-label="Clear search">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {(['All', ...FONT_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3 text-[12px] font-medium transition-colors',
                category === c ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Library */}
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {role === 'accent' && (
          <button type="button" onClick={() => setTypo({ accent_font: null })} className={cn('flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-subtle', !t.accent_font && 'bg-subtle')}>
            <span className="text-muted">No accent font — reuse the heading font</span>
            {!t.accent_font && <Check className="size-4" />}
          </button>
        )}
        {list.map((f) => {
          const selected = activeFont === f.family
          const usedAs = (['heading', 'body', 'accent'] as Role[]).filter((r) => (r === 'accent' ? t.accent_font : t[ROLE_KEY[r]]) === f.family)
          return (
            <button
              key={f.family}
              type="button"
              onClick={() => setTypo({ [ROLE_KEY[role]]: f.family } as Partial<TypographyData>)}
              className={cn('group flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-subtle', selected && 'bg-subtle')}
            >
              <span className="w-12 shrink-0 text-[28px] leading-none" style={{ fontFamily: fontStack(f.family) }}>Aa</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium" style={{ fontFamily: fontStack(f.family) }}>{f.family}</span>
                  {usedAs.map((u) => <Badge key={u} className="px-1.5 py-0 text-[10px] capitalize">{u}</Badge>)}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">{f.note}</span>
              </span>
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border', selected ? 'border-ink bg-ink text-white' : 'border-line-strong text-transparent')}>
                <Check className="size-3" strokeWidth={3} />
              </span>
            </button>
          )
        })}
        {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No fonts match “{query}”.</p>}
      </div>

      {/* Pairings */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Curated pairings</h3>
        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIRINGS.map((p) => {
            const active = t.heading_font === p.heading && t.body_font === p.body && (t.accent_font ?? undefined) === p.accent
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setTypo({ heading_font: p.heading, body_font: p.body, accent_font: p.accent ?? null })}
                className={cn('rounded-xl border bg-surface p-3 text-left transition-all', active ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong')}
              >
                <div className="text-[19px] font-semibold leading-tight" style={{ fontFamily: fontStack(p.heading) }}>{p.name}</div>
                <div className="mt-1 text-[12px] text-muted" style={{ fontFamily: fontStack(p.body) }}>{p.heading} + {p.body}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Saved combinations */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Your shortlist</h3>
            <p className="text-[12px] text-muted">Save combinations to compare them side by side.</p>
          </div>
          <Button
            size="sm"
            variant={isSaved ? 'subtle' : 'outline'}
            disabled={isSaved || t.saved_combinations.length >= 6}
            onClick={() => setTypo({ saved_combinations: [...t.saved_combinations, current] })}
          >
            <Bookmark /> {isSaved ? 'Saved' : 'Save current'}
          </Button>
        </div>
        {t.saved_combinations.length > 0 && (
          <>
            <div className="mt-4 flex flex-col gap-1.5">
              {t.saved_combinations.map((c, i) => {
                const active = sameCombo(c, current)
                return (
                  <div key={i} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2', active ? 'border-ink' : 'border-line')}>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setTypo({ heading_font: c.heading, body_font: c.body, accent_font: c.accent })}>
                      <span className="block truncate text-[14px] font-semibold" style={{ fontFamily: fontStack(c.heading) }}>{c.heading}</span>
                      <span className="block truncate text-[12px] text-muted" style={{ fontFamily: fontStack(c.body) }}>
                        {c.body}{c.accent ? ` · ${c.accent}` : ''}
                      </span>
                    </button>
                    {active && <Badge tone="dark" className="text-[10px]">Active</Badge>}
                    <Button variant="ghost" size="icon-sm" aria-label="Remove combination" onClick={() => setTypo({ saved_combinations: t.saved_combinations.filter((_, j) => j !== i) })}>
                      <Trash2 />
                    </Button>
                  </div>
                )
              })}
            </div>
            {t.saved_combinations.length >= 2 && (
              <Button variant="default" size="sm" className="mt-3 w-full" onClick={() => setCompare((v) => !v)}>
                {compare ? 'Hide comparison' : `Compare ${t.saved_combinations.length} combinations`}
              </Button>
            )}
          </>
        )}
      </div>

      {compare && t.saved_combinations.length >= 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {t.saved_combinations.map((c, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-line p-4" style={{ background: data.colours.background, color: data.colours.text }}>
              <span className="text-[11px] uppercase tracking-wider opacity-60" style={{ fontFamily: fontStack(c.accent ?? c.heading) }}>Option {String.fromCharCode(65 + i)}</span>
              <h4 className="text-[24px] font-semibold leading-tight" style={{ fontFamily: fontStack(c.heading) }}>Crafted for people who notice details</h4>
              <p className="text-[13px] leading-relaxed opacity-75" style={{ fontFamily: fontStack(c.body) }}>
                Body copy set in {c.body}. Readable, calm and comfortable for longer paragraphs.
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={sameCombo(c, current)}
                className="self-start"
                onClick={() => setTypo({ heading_font: c.heading, body_font: c.body, accent_font: c.accent })}
              >
                {sameCombo(c, current) ? 'In use' : 'Use this'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <StepHeader
        index={4}
        title="Find your typography"
        description="Pick a heading font, a body font and optionally an accent font. Every choice updates the website preview instantly — try a few."
      />
      <StudioLayout controls={controls} />
    </div>
  )
}
