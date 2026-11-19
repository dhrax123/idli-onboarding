import { createContext, useContext, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { OnboardingController } from '@/hooks/useOnboarding'
import type { OnboardingData, OnboardingPayload, DesignConfig, YesNoUnsure } from '@/lib/types'
import { STEPS } from '@/lib/steps'
import { cn } from '@/lib/utils'

export interface OnboardingCtx extends OnboardingController {
  token: string
  payload: OnboardingPayload
  data: OnboardingData
}

export const OnboardingContext = createContext<OnboardingCtx | null>(null)

export function useOnb() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnb must be used inside OnboardingContext')
  return ctx
}

export function designConfigFrom(data: OnboardingData, fallbackName: string): DesignConfig {
  return {
    typography: data.typography,
    colours: data.colours,
    layout: data.layout,
    brandName: data.business.company_name || fallbackName,
  }
}

export function StepHeader({ index, title, description, children }: { index: number; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-10 animate-fade-up">
      <p className="mb-3 font-mono text-xs tracking-wide text-muted">
        {String(index).padStart(2, '0')} <span className="text-faint">/ {String(STEPS.length - 1).padStart(2, '0')}</span>
        <span className="mx-2 text-line-strong">·</span>
        {STEPS[index].label}
      </p>
      <h1 className="text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[34px]">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted sm:text-base">{description}</p>}
      {children}
    </header>
  )
}

export function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  children,
  className,
  multi = true,
}: {
  selected: boolean
  onClick: () => void
  title: string
  description?: string
  children?: ReactNode
  className?: string
  multi?: boolean
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-surface text-left transition-all duration-150',
        selected
          ? 'border-ink shadow-[0_0_0_1px_var(--color-ink),0_8px_24px_-12px_rgba(12,10,9,0.25)]'
          : 'border-line hover:border-line-strong hover:shadow-[0_4px_16px_-10px_rgba(12,10,9,0.2)]',
        className,
      )}
    >
      {children}
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[15px] font-medium">{title}</div>
          {description && <div className="mt-0.5 text-[13px] leading-snug text-muted">{description}</div>}
        </div>
        <span
          className={cn(
            'mt-0.5 grid size-5 shrink-0 place-items-center border transition-colors',
            multi ? 'rounded-md' : 'rounded-full',
            selected ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-transparent',
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      </div>
    </button>
  )
}

export function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full border px-4 text-[13px] font-medium transition-all',
        selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
      )}
    >
      {children}
    </button>
  )
}

export function YesNo({ value, onChange, allowUnsure = true }: { value?: YesNoUnsure; onChange: (v: YesNoUnsure) => void; allowUnsure?: boolean }) {
  const opts: { v: YesNoUnsure; l: string }[] = [
    { v: 'yes', l: 'Yes' },
    { v: 'no', l: 'No' },
    ...(allowUnsure ? [{ v: 'unsure' as const, l: 'Not sure' }] : []),
  ]
  return (
    <div role="radiogroup" className="inline-flex rounded-lg border border-line bg-subtle p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'h-8 min-w-14 rounded-md px-3 text-[13px] font-medium text-muted transition-all',
            value === o.v && 'bg-surface text-ink shadow-[0_1px_2px_rgba(12,10,9,0.1)]',
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Section({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-line pt-8', className)}>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}
