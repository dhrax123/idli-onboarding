import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Check, Copy, RotateCcw } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import {
  COLOUR_ROLES, DEFAULT_COLOURS, PRESET_PALETTES, contrastRatio, hexToRgb, normaliseHex, onColour, rgbToHex, wcagLabel,
} from '@/lib/colour'
import type { ColourData, ColourRole } from '@/lib/types'
import { cn, copyText } from '@/lib/utils'
import { StepHeader, useOnb } from '../shared'
import { StudioLayout } from '../StudioLayout'

function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const valid = normaliseHex(draft) !== null
  return (
    <div className="relative">
      <Input
        value={draft}
        aria-label="HEX value"
        aria-invalid={!valid}
        spellCheck={false}
        maxLength={7}
        className={cn('font-mono uppercase', !valid && 'border-danger focus:border-danger')}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = normaliseHex(e.target.value)
          if (n && e.target.value.replace('#', '').length === 6) onCommit(n)
        }}
        onBlur={() => {
          const n = normaliseHex(draft)
          if (n) onCommit(n)
          else setDraft(value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </div>
  )
}

function RgbInputs({ hex, onCommit }: { hex: string; onCommit: (hex: string) => void }) {
  const rgb = hexToRgb(hex)
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['r', 'g', 'b'] as const).map((k) => (
        <label key={k} className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium uppercase text-faint">{k}</span>
          <Input
            type="number"
            min={0}
            max={255}
            value={rgb[k]}
            aria-label={`${k.toUpperCase()} channel`}
            className="h-10 pl-8 font-mono text-sm"
            onChange={(e) => {
              const v = Math.max(0, Math.min(255, Number(e.target.value) || 0))
              const next = { ...rgb, [k]: v }
              onCommit(rgbToHex(next.r, next.g, next.b))
            }}
          />
        </label>
      ))}
    </div>
  )
}

export function ColourStudioStep() {
  const { data, update } = useOnb()
  const c = data.colours
  const [role, setRole] = useState<ColourRole>('primary')

  const setColour = (r: ColourRole, hex: string) => update('colours', (prev) => ({ ...prev, [r]: hex, preset: null }))
  const applyPreset = (name: string) => {
    const p = PRESET_PALETTES.find((x) => x.name === name)
    if (p) update('colours', { ...p.colours, preset: p.name })
  }
  const reset = () => {
    const base = PRESET_PALETTES.find((p) => p.name === c.preset)
    update('colours', base ? { ...base.colours, preset: base.name } : { ...DEFAULT_COLOURS })
  }

  const textContrast = contrastRatio(c.text, c.background)
  const primaryContrast = contrastRatio(c.primary, c.background)
  const active = c[role]

  const controls = (
    <div className="flex flex-col gap-6">
      {/* Roles */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {COLOUR_ROLES.map(({ role: r, label, usage }) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn('flex w-full items-center gap-3 border-b border-line px-3.5 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle', role === r && 'bg-subtle')}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10" style={{ background: c[r] }}>
              {role === r && <Check className="size-4" style={{ color: onColour(c[r]) }} strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-[12px] text-muted">{usage}</span>
            </span>
            <span className="font-mono text-[13px] text-ink-2">{c[r]}</span>
          </button>
        ))}
      </div>

      {/* Editor for the active role */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold capitalize">{role} colour</span>
          <Button variant="ghost" size="sm" onClick={() => copyText(active, `Copied ${active}`)}>
            <Copy /> Copy
          </Button>
        </div>
        <div className="colour-picker">
          <HexColorPicker color={active} onChange={(v) => setColour(role, v.toUpperCase())} style={{ width: '100%', height: 180 }} />
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
          <HexInput value={active} onCommit={(h) => setColour(role, h)} />
          <label className="relative block size-11 cursor-pointer overflow-hidden rounded-lg border border-line" title="System colour picker">
            <input type="color" value={active.toLowerCase()} onChange={(e) => setColour(role, e.target.value.toUpperCase())} className="absolute inset-[-6px] h-[calc(100%+12px)] w-[calc(100%+12px)] cursor-pointer" aria-label="System colour picker" />
          </label>
        </div>
        <div className="mt-2">
          <RgbInputs hex={active} onCommit={(h) => setColour(role, h)} />
        </div>
      </div>

      {/* Accessibility */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: 'Text on background', r: textContrast, a: c.text, b: c.background },
          { l: 'Primary on background', r: primaryContrast, a: c.primary, b: c.background },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="grid size-8 place-items-center rounded-md text-sm font-semibold" style={{ background: x.b, color: x.a, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>Aa</span>
              <Badge tone={x.r >= 4.5 ? 'success' : x.r >= 3 ? 'warn' : 'danger'}>{wcagLabel(x.r)}</Badge>
            </div>
            <div className="mt-2 text-[12px] text-muted">{x.l}</div>
            <div className="font-mono text-[13px]">{x.r.toFixed(2)} : 1</div>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Preset palettes</h3>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw /> Reset
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p.name)}
              className={cn('overflow-hidden rounded-xl border bg-surface text-left transition-all', c.preset === p.name ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong')}
            >
              <div className="flex h-12">
                {(['background', 'primary', 'secondary', 'accent', 'text'] as (keyof ColourData)[]).map((k) => (
                  <span key={k} className="flex-1" style={{ background: p.colours[k as ColourRole] }} />
                ))}
              </div>
              <div className="px-3 py-2">
                <div className="text-[13px] font-medium">{p.name}</div>
                <div className="truncate text-[11px] text-muted">{p.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {!c.preset && <p className="text-[12px] text-muted">You’re using a custom palette. Reset returns to the Minimal starter palette.</p>}
    </div>
  )

  return (
    <div>
      <StepHeader
        index={5}
        title="Shape your colour palette"
        description="Start from a preset or build your own. Change any colour and the website preview repaints instantly — buttons, links, cards and backgrounds."
      />
      <StudioLayout controls={controls} />
    </div>
  )
}
