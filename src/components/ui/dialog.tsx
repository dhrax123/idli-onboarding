import * as React from 'react'
import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  side,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string; description?: string; side?: 'center' | 'right' }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          'fixed z-50 bg-surface shadow-[0_24px_64px_-16px_rgba(12,10,9,0.25)] focus:outline-none',
          side === 'right'
            ? 'inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line data-[state=open]:animate-fade-in'
            : 'left-1/2 top-1/2 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line data-[state=open]:animate-fade-in',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <D.Title className="text-base font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close className="-mr-2 -mt-1 grid size-8 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </D.Close>
        </div>
        <div className={cn(side === 'right' && 'flex-1 overflow-y-auto')}>{children}</div>
      </D.Content>
    </D.Portal>
  )
}
