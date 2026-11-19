import { useState } from 'react'
import { Check } from 'lucide-react'
import { Field, Textarea } from '@/components/ui'
import { LAYOUT_GROUPS } from '@/lib/options'
import type { LayoutData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { LayoutThumb } from '../LayoutThumb'
import { StepHeader, useOnb } from '../shared'
import { StudioLayout } from '../StudioLayout'

export function LayoutStudioStep() {
  const { data, update } = useOnb()
  const l = data.layout
  const [open, setOpen] = useState<string>(LAYOUT_GROUPS[0].key)

  const controls = (
    <div className="flex flex-col gap-3">
      {LAYOUT_GROUPS.map((g) => {
        const expanded = open === g.key
        const chosen = g.options.find((o) => o.id === l[g.key])
        return (
          <div key={g.key} className={cn('overflow-hidden rounded-xl border bg-surface transition-colors', expanded ? 'border-line-strong' : 'border-line')}>
            <button type="button" onClick={() => setOpen(expanded ? '' : g.key)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={expanded}>
              <span>
                <span className="block text-sm font-semibold">{g.label}</span>
                <span className="block text-[12px] text-muted">{expanded ? g.question : chosen?.label ?? 'Not chosen'}</span>
              </span>
              <span className={cn('text-lg leading-none text-muted transition-transform', expanded && 'rotate-45')}>+</span>
            </button>
            {expanded && (
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                {g.options.map((o) => {
                  const selected = l[g.key] === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update('layout', (prev) => ({ ...prev, [g.key]: o.id }) as LayoutData)}
                      className={cn('relative overflow-hidden rounded-lg border text-left transition-all', selected ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong')}
                    >
                      <LayoutThumb group={g.key} id={o.id} primary={data.colours.primary} />
                      <div className="border-t border-line bg-surface px-2.5 py-2">
                        <div className="text-[13px] font-medium">{o.label}</div>
                        <div className="truncate text-[11px] text-muted">{o.description}</div>
                      </div>
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-ink text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <Field label="Anything else about layout?" optional className="mt-4">
        <Textarea value={l.notes} rows={3} maxLength={3000} onChange={(e) => update('layout', (prev) => ({ ...prev, notes: e.target.value }))} placeholder="e.g. We want a sticky header and a big product carousel." />
      </Field>
    </div>
  )

  return (
    <div>
      <StepHeader index={6} title="Arrange your website" description="Experiment with navigation, hero, buttons, cards, sections, imagery and footer. The preview rebuilds itself with each choice." />
      <StudioLayout controls={controls} />
    </div>
  )
}
