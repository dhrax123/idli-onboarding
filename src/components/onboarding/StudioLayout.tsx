import { useState, type ReactNode } from 'react'
import * as D from '@radix-ui/react-dialog'
import { Eye, X } from 'lucide-react'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { designConfigFrom, useOnb } from './shared'

/** Two-pane studio: controls on the left, sticky live preview on the right. */
export function StudioLayout({ controls }: { controls: ReactNode }) {
  const { data, payload } = useOnb()
  const config = designConfigFrom(data, payload.client.company_name)
  const [open, setOpen] = useState(false)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(340px,420px)_1fr] lg:gap-10">
      <div className="min-w-0">{controls}</div>
      <div className="hidden min-w-0 lg:block">
        <div className="sticky top-24">
          <PreviewPanel config={config} />
        </div>
      </div>

      {/* Mobile: preview in a bottom sheet */}
      <D.Root open={open} onOpenChange={setOpen}>
        <D.Trigger asChild>
          <button
            type="button"
            className="fixed bottom-24 right-4 z-30 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white shadow-[0_8px_24px_-6px_rgba(12,10,9,0.5)] lg:hidden"
          >
            <Eye className="size-4" /> Live preview
          </button>
        </D.Trigger>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-ink/30 data-[state=open]:animate-fade-in" />
          <D.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-canvas p-4 pb-8 data-[state=open]:animate-fade-up focus:outline-none">
            <div className="mb-3 flex items-center justify-between">
              <D.Title className="text-sm font-semibold">Your website, live</D.Title>
              <D.Description className="sr-only">Preview of the website using your current selections</D.Description>
              <D.Close className="grid size-8 place-items-center rounded-md hover:bg-subtle">
                <X className="size-4" />
              </D.Close>
            </div>
            <PreviewPanel config={config} compact />
          </D.Content>
        </D.Portal>
      </D.Root>
    </div>
  )
}
