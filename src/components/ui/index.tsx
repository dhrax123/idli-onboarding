import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* ------------------------------- Button ------------------------------- */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-ink/85 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_1px_2px_rgba(12,10,9,0.18)]',
        outline: 'border border-line-strong bg-surface text-ink hover:bg-subtle',
        ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
        subtle: 'bg-subtle text-ink hover:bg-line',
        danger: 'bg-danger text-white hover:bg-danger/90',
        link: 'text-ink underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

/* -------------------------------- Inputs ------------------------------ */
const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:opacity-60'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, 'h-11', className)} {...props} />,
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(fieldBase, 'resize-y py-3 leading-relaxed', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        fieldBase,
        'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20fill=%27none%27%20stroke=%27%2378716c%27%20stroke-width=%272%27%20viewBox=%270%200%2024%2024%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-ink', className)} {...props} />
}

export function Field({
  label,
  hint,
  htmlFor,
  optional,
  children,
  className,
}: {
  label: string
  hint?: string
  htmlFor?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-faint">Optional</span>}
      </div>
      {children}
      {hint && <p className="text-[13px] leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}

/* ------------------------------- Display ------------------------------ */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-line bg-surface', className)} {...props} />
}

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-subtle text-ink-2',
      success: 'bg-green-50 text-success',
      warn: 'bg-amber-50 text-warn',
      info: 'bg-blue-50 text-info',
      danger: 'bg-red-50 text-danger',
      dark: 'bg-ink text-white',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function Badge({
  className,
  tone,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('size-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; title?: string }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex rounded-lg border border-line bg-subtle p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-md font-medium text-muted transition-all [&_svg]:size-4',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
            value === o.value && 'bg-surface text-ink shadow-[0_1px_2px_rgba(12,10,9,0.08)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] text-muted">{children}</kbd>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 grid size-11 place-items-center rounded-xl border border-line bg-surface text-muted">{icon}</div>}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
