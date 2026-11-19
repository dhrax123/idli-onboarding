import { cn } from '@/lib/utils'

export function BrandMark({ className, label = true }: { className?: string; label?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#0C0A09" />
        <ellipse cx="16" cy="18" rx="9" ry="5.5" fill="#FAFAF9" />
        <ellipse cx="16" cy="15.5" rx="9" ry="4.5" fill="#D6D3D1" />
      </svg>
      {label && <span className="text-[15px] font-semibold tracking-tight">idli studios</span>}
    </span>
  )
}
