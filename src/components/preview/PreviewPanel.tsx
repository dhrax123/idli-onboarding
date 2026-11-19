import { useState } from 'react'
import { Maximize2, Monitor, Smartphone } from 'lucide-react'
import { LivePreview, type PreviewDevice } from './LivePreview'
import type { DesignConfig } from '@/lib/types'
import { Button, Segmented } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function BrowserChrome({ url, children, mobile }: { url: string; children: React.ReactNode; mobile: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden border border-line bg-surface shadow-[0_1px_2px_rgba(12,10,9,0.04),0_16px_40px_-20px_rgba(12,10,9,0.25)]',
        mobile ? 'mx-auto w-full max-w-[340px] rounded-[28px] border-[6px] border-ink' : 'rounded-xl',
      )}
    >
      {!mobile && (
        <div className="flex items-center gap-3 border-b border-line bg-subtle/70 px-3.5 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </div>
          <div className="mx-auto max-w-[60%] flex-1 truncate rounded-md bg-surface px-3 py-1 text-center text-[11px] text-muted">{url}</div>
          <div className="w-10" />
        </div>
      )}
      {mobile && <div className="mx-auto my-1.5 h-1.5 w-16 rounded-full bg-ink/80" />}
      <div className={cn('overflow-y-auto overscroll-contain', mobile ? 'max-h-[600px]' : 'max-h-[calc(100vh-260px)] min-h-[420px]')}>{children}</div>
    </div>
  )
}

export function PreviewPanel({ config, className, compact }: { config: DesignConfig; className?: string; compact?: boolean }) {
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [full, setFull] = useState(false)
  const domain = `${(config.brandName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourbrand'}.com`
  const t = config.typography

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          <span className="text-[13px] font-medium">Live preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            size="sm"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: <Monitor />, title: 'Desktop preview' },
              { value: 'mobile', label: <Smartphone />, title: 'Mobile preview' },
            ]}
          />
          {!compact && (
            <Button variant="outline" size="icon-sm" onClick={() => setFull(true)} title="Open full preview">
              <Maximize2 />
            </Button>
          )}
        </div>
      </div>

      <BrowserChrome url={domain} mobile={device === 'mobile'}>
        <LivePreview config={config} device={device} />
      </BrowserChrome>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
        <span>Headings <b className="font-medium text-ink">{t.heading_font}</b></span>
        <span>Body <b className="font-medium text-ink">{t.body_font}</b></span>
        {t.accent_font && <span>Accent <b className="font-medium text-ink">{t.accent_font}</b></span>}
        <span className="flex items-center gap-1">
          {(['primary', 'secondary', 'accent', 'background', 'text'] as const).map((k) => (
            <span key={k} title={`${k} ${config.colours[k]}`} className="size-3 rounded-full border border-black/10" style={{ background: config.colours[k] }} />
          ))}
        </span>
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent title="Full preview" description="Scroll through your design at full size." className="max-w-[min(1320px,calc(100vw-2rem))]">
          <div className="flex justify-center p-4">
            <Segmented
              value={device}
              onChange={setDevice}
              options={[
                { value: 'desktop', label: <><Monitor /> Desktop</> },
                { value: 'mobile', label: <><Smartphone /> Mobile</> },
              ]}
            />
          </div>
          <div className="px-4 pb-4">
            <BrowserChrome url={domain} mobile={device === 'mobile'}>
              <LivePreview config={config} device={device} />
            </BrowserChrome>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
