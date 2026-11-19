import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button, Field, Input, Textarea } from '@/components/ui'
import type { CompetitorRef, InspirationRef } from '@/lib/types'
import { isLikelyUrl, normaliseUrl } from '@/lib/utils'
import { StepHeader, useOnb } from '../shared'

function hostOf(url: string) {
  try {
    return new URL(normaliseUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function Favicon({ url }: { url: string }) {
  const host = hostOf(url)
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-subtle">
      {host && isLikelyUrl(url) ? (
        <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" className="size-5" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="size-2 rounded-full bg-line-strong" />
      )}
    </span>
  )
}

/* ---------------------------- 08 Inspiration ----------------------------- */
export function InspirationStep() {
  const { data, update } = useOnb()
  const refs = data.inspiration
  const set = (i: number, patch: Partial<InspirationRef>) => update('inspiration', (prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const filled = refs.filter((r) => r.url.trim()).length

  return (
    <div className="mx-auto max-w-3xl">
      <StepHeader index={7} title="Websites you admire" description="Share 3 to 5 websites you love — from any industry. Tell us what specifically caught your eye: the layout, the typography, the animations, the tone.">
        <p className="mt-4 text-sm text-muted">
          <b className="font-medium text-ink">{filled}</b> of 3–5 added
        </p>
      </StepHeader>
      <div className="flex flex-col gap-4">
        {refs.map((r, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Favicon url={r.url} />
              <Input value={r.url} inputMode="url" placeholder={['linear.app', 'stripe.com', 'aesop.com', 'apple.com', 'framer.com'][i % 5]} onChange={(e) => set(i, { url: e.target.value })} aria-label={`Website ${i + 1} URL`} aria-invalid={!isLikelyUrl(r.url)} />
              {r.url && isLikelyUrl(r.url) && (
                <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                  <a href={normaliseUrl(r.url)} target="_blank" rel="noreferrer noopener" aria-label="Open website"><ExternalLink /></a>
                </Button>
              )}
              {refs.length > 1 && (
                <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Remove website" onClick={() => update('inspiration', (prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              )}
            </div>
            {!isLikelyUrl(r.url) && <p className="mt-2 text-[13px] text-danger">That doesn’t look like a web address.</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Textarea rows={2} value={r.likes} onChange={(e) => set(i, { likes: e.target.value })} placeholder="What do you like about it?" aria-label="What you like" maxLength={3000} />
              <Textarea rows={2} value={r.comment} onChange={(e) => set(i, { comment: e.target.value })} placeholder="Any other comments (optional)" aria-label="Comments" maxLength={3000} />
            </div>
          </div>
        ))}
        {refs.length < 10 && (
          <Button variant="outline" className="self-start" onClick={() => update('inspiration', (prev) => [...prev, { url: '', likes: '', comment: '' }])}>
            <Plus /> Add another website
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- 09 Competitors ----------------------------- */
export function CompetitorsStep() {
  const { data, update } = useOnb()
  const comp = data.competitors
  const set = (i: number, patch: Partial<CompetitorRef>) => update('competitors', (prev) => ({ ...prev, items: prev.items.map((c, j) => (j === i ? { ...c, ...patch } : c)) }))

  return (
    <div className="mx-auto max-w-3xl">
      <StepHeader index={8} title="Who are you up against?" description="Knowing your competitors helps us position you clearly — and avoid looking like everyone else." />
      <div className="flex flex-col gap-4">
        {comp.items.map((c, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted">Competitor {i + 1}</span>
              {comp.items.length > 1 && (
                <Button variant="ghost" size="icon-sm" aria-label="Remove competitor" onClick={() => update('competitors', (prev) => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }))}>
                  <Trash2 />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Company name" aria-label="Competitor name" maxLength={200} />
              <div className="flex gap-2">
                <Favicon url={c.url} />
                <Input value={c.url} inputMode="url" onChange={(e) => set(i, { url: e.target.value })} placeholder="Website" aria-label="Competitor website" aria-invalid={!isLikelyUrl(c.url)} />
              </div>
              <Textarea rows={2} value={c.likes} onChange={(e) => set(i, { likes: e.target.value })} placeholder="What do they do well?" aria-label="What they do well" maxLength={3000} />
              <Textarea rows={2} value={c.avoid} onChange={(e) => set(i, { avoid: e.target.value })} placeholder="What should we avoid?" aria-label="What to avoid" maxLength={3000} />
            </div>
          </div>
        ))}
        {comp.items.length < 10 && (
          <Button variant="outline" className="self-start" onClick={() => update('competitors', (prev) => ({ ...prev, items: [...prev.items, { name: '', url: '', likes: '', avoid: '' }] }))}>
            <Plus /> Add competitor
          </Button>
        )}
      </div>
      <Field label="Overall, what do you want to avoid in your industry’s websites?" optional className="mt-10" hint="Clichés, stock photos, cluttered pages, generic copy…">
        <Textarea rows={3} value={comp.notes} onChange={(e) => update('competitors', (prev) => ({ ...prev, notes: e.target.value }))} maxLength={5000} />
      </Field>
    </div>
  )
}
