import type { ReactNode } from 'react'
import { Copy, Download, ExternalLink, FileText, Image as ImageIcon, Pencil } from 'lucide-react'
import { Button } from '@/components/ui'
import { COLOUR_ROLES } from '@/lib/colour'
import { fontStack } from '@/lib/fonts'
import { ASSET_CATEGORIES, LAYOUT_GROUPS, TECH_QUESTIONS, labelFor } from '@/lib/options'
import type { AssetRecord, OnboardingData } from '@/lib/types'
import { cn, copyText, formatBytes, normaliseUrl } from '@/lib/utils'

function Row({ label, children }: { label: string; children: ReactNode }) {
  const empty = children === null || children === undefined || children === '' || (Array.isArray(children) && children.length === 0)
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={cn('whitespace-pre-wrap break-words text-[14px] leading-relaxed', empty && 'text-faint')}>{empty ? 'Not provided' : children}</dd>
    </div>
  )
}

function Block({ id, title, step, onEdit, actions, children }: { id?: string; title: string; step?: number; onEdit?: (step: number) => void; actions?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <div className="flex items-center gap-1">
          {actions}
          {onEdit && step !== undefined && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
              <Pencil /> Edit
            </Button>
          )}
        </div>
      </header>
      <dl className="divide-y divide-line px-5">{children}</dl>
    </section>
  )
}

function LinkOut({ url }: { url: string }) {
  if (!url) return null
  return (
    <a href={normaliseUrl(url)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline decoration-line-strong underline-offset-4 hover:decoration-ink">
      {url} <ExternalLink className="size-3" />
    </a>
  )
}

export function BriefSummary({
  data,
  assets,
  onEdit,
  agency,
  onOpenAsset,
  onDownloadAsset,
}: {
  data: OnboardingData
  assets: AssetRecord[]
  onEdit?: (step: number) => void
  agency?: boolean
  onOpenAsset?: (a: AssetRecord) => void
  onDownloadAsset?: (a: AssetRecord) => void
}) {
  const { business: b, project: p, brand, typography: t, colours: c, layout: l, inspiration, competitors, technical } = data
  const socials = b.social_links.filter(Boolean)
  const refs = inspiration.filter((r) => r.url || r.likes)
  const comps = competitors.items.filter((x) => x.name || x.url)
  const allHex = COLOUR_ROLES.map((r) => `${r.label}: ${c[r.role]}`).join('\n')

  return (
    <div className="flex flex-col gap-5">
      <Block id="business" title="Business" step={1} onEdit={onEdit}>
        <Row label="Company / brand">{b.company_name}</Row>
        <Row label="About">{b.about}</Row>
        <Row label="Industry">{b.industry}</Row>
        <Row label="Products & services">{b.offerings}</Row>
        <Row label="Target audience">{b.target_audience}</Row>
        <Row label="Differentiators">{b.differentiators}</Row>
        <Row label="Current website">{b.has_website === 'yes' ? <LinkOut url={b.website_url} /> : b.has_website === 'no' ? 'No website yet' : ''}</Row>
        <Row label="Social links">{socials.length ? <div className="flex flex-col gap-1">{socials.map((s) => <LinkOut key={s} url={s} />)}</div> : ''}</Row>
      </Block>

      <Block id="project" title="Project requirements" step={2} onEdit={onEdit}>
        <Row label="Project type">{p.project_types.map(labelFor.projectType).join(', ') + (p.other_type ? ` — ${p.other_type}` : '')}</Row>
        <Row label="Primary objective">{p.objective}</Row>
        <Row label="Functionality">{p.functionality}</Row>
        <Row label="Integrations">{p.integrations}</Row>
        <Row label="Timeline">{[p.timeline, p.launch_date && `Launch ${p.launch_date}`].filter(Boolean).join(' · ')}</Row>
        <Row label="Budget">{p.budget_range}</Row>
        <Row label="Expected outcome">{p.expected_outcome}</Row>
      </Block>

      <Block id="brand" title="Brand personality" step={3} onEdit={onEdit}>
        <Row label="Should feel">
          {brand.personalities.length ? (
            <div className="flex flex-wrap gap-1.5">{brand.personalities.map((x) => <span key={x} className="rounded-full bg-subtle px-2.5 py-0.5 text-[13px]">{labelFor.personality(x)}</span>)}</div>
          ) : ''}
        </Row>
        <Row label="Notes">{brand.notes}</Row>
      </Block>

      <Block
        id="typography"
        title="Typography"
        step={4}
        onEdit={onEdit}
        actions={agency && (
          <Button variant="ghost" size="sm" onClick={() => copyText([t.heading_font, t.body_font, t.accent_font].filter(Boolean).join(', '), 'Font names copied')}>
            <Copy /> Copy fonts
          </Button>
        )}
      >
        {([['Heading', t.heading_font], ['Body', t.body_font], ['Accent', t.accent_font]] as const).map(([label, fam]) => (
          <Row key={label} label={`${label} font`}>
            {fam ? (
              <div className="flex items-center justify-between gap-3">
                <span style={{ fontFamily: fontStack(fam) }} className="text-[18px]">{fam}</span>
                {agency && <Button variant="ghost" size="icon-sm" aria-label={`Copy ${fam}`} onClick={() => copyText(fam)}><Copy /></Button>}
              </div>
            ) : ''}
          </Row>
        ))}
        {t.saved_combinations.length > 0 && (
          <Row label="Shortlisted combos">{t.saved_combinations.map((x) => `${x.heading} + ${x.body}${x.accent ? ` + ${x.accent}` : ''}`).join('\n')}</Row>
        )}
      </Block>

      <Block
        id="colours"
        title="Colour palette"
        step={5}
        onEdit={onEdit}
        actions={agency && (
          <Button variant="ghost" size="sm" onClick={() => copyText(allHex, 'All HEX codes copied')}>
            <Copy /> Copy all
          </Button>
        )}
      >
        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-5">
          {COLOUR_ROLES.map(({ role, label }) => (
            <button
              key={role}
              type="button"
              onClick={() => copyText(c[role], `Copied ${c[role]}`)}
              className="group overflow-hidden rounded-lg border border-line text-left transition-shadow hover:shadow-sm"
              title="Copy HEX"
            >
              <span className="block h-16" style={{ background: c[role] }} />
              <span className="flex items-center justify-between px-2.5 py-2">
                <span>
                  <span className="block text-[12px] text-muted">{label}</span>
                  <span className="block font-mono text-[13px]">{c[role]}</span>
                </span>
                <Copy className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </button>
          ))}
        </div>
        <Row label="Palette">{c.preset ? `${c.preset} preset` : 'Custom palette'}</Row>
      </Block>

      <Block id="layout" title="Layout preferences" step={6} onEdit={onEdit}>
        {LAYOUT_GROUPS.map((g) => <Row key={g.key} label={g.label}>{labelFor.layout(g.key, l[g.key])}</Row>)}
        <Row label="Notes">{l.notes}</Row>
      </Block>

      <Block id="inspiration" title="Website inspiration" step={7} onEdit={onEdit}>
        {refs.length === 0 && <Row label="References">{''}</Row>}
        {refs.map((r, i) => (
          <Row key={i} label={`Reference ${i + 1}`}>
            <div className="flex flex-col gap-1">
              <LinkOut url={r.url} />
              {r.likes && <span><span className="text-muted">Likes: </span>{r.likes}</span>}
              {r.comment && <span><span className="text-muted">Comment: </span>{r.comment}</span>}
            </div>
          </Row>
        ))}
      </Block>

      <Block id="competitors" title="Competitors" step={8} onEdit={onEdit}>
        {comps.length === 0 && <Row label="Competitors">{''}</Row>}
        {comps.map((x, i) => (
          <Row key={i} label={x.name || `Competitor ${i + 1}`}>
            <div className="flex flex-col gap-1">
              <LinkOut url={x.url} />
              {x.likes && <span><span className="text-muted">Does well: </span>{x.likes}</span>}
              {x.avoid && <span><span className="text-muted">Avoid: </span>{x.avoid}</span>}
            </div>
          </Row>
        ))}
        <Row label="Avoid overall">{competitors.notes}</Row>
      </Block>

      <Block id="technical" title="Technical requirements" step={9} onEdit={onEdit}>
        {TECH_QUESTIONS.map((q) => {
          const a = technical.answers[q.key]
          const detail = q.detail && a === 'yes' ? technical[q.detail] : ''
          return (
            <Row key={q.key} label={q.label.replace(/^Do you (require |have |own )?|^Is your /, '').replace(/\?$/, '').replace(/^./, (m) => m.toUpperCase())}>
              {a ? (
                <span>
                  <span className={cn('font-medium', a === 'yes' ? 'text-success' : a === 'no' ? 'text-ink-2' : 'text-warn')}>{a === 'unsure' ? 'Not sure' : a === 'yes' ? 'Yes' : 'No'}</span>
                  {detail && <span className="text-muted"> — {detail}</span>}
                </span>
              ) : ''}
            </Row>
          )
        })}
        <Row label="Other notes">{technical.notes}</Row>
      </Block>

      <Block id="assets" title={`Uploaded assets (${assets.length})`} step={9} onEdit={onEdit}>
        {assets.length === 0 ? (
          <Row label="Files">{''}</Row>
        ) : (
          <ul className="divide-y divide-line">
            {assets.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted">
                  {a.mime_type?.startsWith('image/') ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.file_name}</div>
                  <div className="text-[12px] text-muted">{ASSET_CATEGORIES.find((x) => x.id === a.category)?.label} · {formatBytes(a.size_bytes)}</div>
                </div>
                {onOpenAsset && <Button variant="ghost" size="icon-sm" aria-label="Open" onClick={() => onOpenAsset(a)}><ExternalLink /></Button>}
                {onDownloadAsset && <Button variant="ghost" size="icon-sm" aria-label="Download" onClick={() => onDownloadAsset(a)}><Download /></Button>}
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  )
}
