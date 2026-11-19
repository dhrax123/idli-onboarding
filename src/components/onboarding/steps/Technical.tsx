import { useRef, useState, type DragEvent } from 'react'
import { FileText, Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Select, Spinner, Textarea } from '@/components/ui'
import { ACCEPTED_UPLOADS, MAX_UPLOAD_BYTES, removeAsset, uploadAsset } from '@/lib/onboarding-api'
import { ASSET_CATEGORIES, TECH_QUESTIONS } from '@/lib/options'
import type { AssetRecord, TechnicalData } from '@/lib/types'
import { cn, formatBytes, friendlyError } from '@/lib/utils'
import { StepHeader, useOnb, YesNo } from '../shared'

function guessCategory(file: File): AssetRecord['category'] {
  const n = file.name.toLowerCase()
  if (n.includes('logo')) return 'logo'
  if (n.includes('guideline') || n.includes('brandbook') || n.includes('brand-book')) return 'brand_guidelines'
  if (file.type.startsWith('image/')) return 'image'
  if (/\.(pdf|docx?|pptx?|txt)$/.test(n)) return 'document'
  return 'other'
}

export function AssetUploader() {
  const { token, assets, setAssets } = useOnb()
  const [category, setCategory] = useState<AssetRecord['category'] | 'auto'>('auto')
  const [uploading, setUploading] = useState<{ name: string; done: boolean }[]>([])
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function handle(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(list.map((f) => ({ name: f.name, done: false })))
    for (const [i, f] of list.entries()) {
      try {
        if (f.size > MAX_UPLOAD_BYTES) throw new Error(`${f.name} is larger than 25 MB`)
        const rec = await uploadAsset(token, f, category === 'auto' ? guessCategory(f) : category)
        setAssets((prev) => [...prev, rec])
      } catch (e) {
        toast.error(`Could not upload ${f.name}`, { description: friendlyError(e) })
      } finally {
        setUploading((prev) => prev.map((u, j) => (j === i ? { ...u, done: true } : u)))
      }
    }
    setUploading([])
    if (input.current) input.current.value = ''
  }

  async function remove(a: AssetRecord) {
    try {
      await removeAsset(token, a.id)
      setAssets((prev) => prev.filter((x) => x.id !== a.id))
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    void handle(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">File type</span>
        <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="h-9 w-auto text-sm">
          <option value="auto">Detect automatically</option>
          {ASSET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
          drag ? 'border-ink bg-subtle' : 'border-line-strong bg-surface hover:bg-subtle/60',
        )}
      >
        <UploadCloud className="mb-3 size-6 text-muted" />
        <p className="text-sm font-medium">Drop files here or <span className="underline underline-offset-4">browse</span></p>
        <p className="mt-1 text-[13px] text-muted">Logos, brand guidelines, documents, images · up to 25 MB each</p>
        <input ref={input} type="file" multiple accept={ACCEPTED_UPLOADS} className="hidden" onChange={(e) => e.target.files && handle(e.target.files)} />
      </div>

      {uploading.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted">
              {u.done ? <span className="size-4" /> : <Spinner />} {u.name}
            </div>
          ))}
        </div>
      )}

      {assets.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {assets.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted">
                {a.mime_type?.startsWith('image/') ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.file_name}</div>
                <div className="text-[12px] text-muted">
                  {ASSET_CATEGORIES.find((c) => c.id === a.category)?.label} · {formatBytes(a.size_bytes)}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${a.file_name}`} onClick={() => remove(a)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TechnicalStep() {
  const { data, update } = useOnb()
  const t = data.technical
  const set = (patch: Partial<TechnicalData>) => update('technical', (prev) => ({ ...prev, ...patch }))

  return (
    <div className="mx-auto max-w-3xl">
      <StepHeader index={9} title="Technical details" description="Quick yes/no answers are perfect. “Not sure” is a perfectly good answer — we’ll help you figure it out." />
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {TECH_QUESTIONS.map((q) => (
          <div key={q.key} className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[15px]">{q.label}</span>
              <YesNo value={t.answers[q.key]} onChange={(v) => set({ answers: { ...t.answers, [q.key]: v } })} />
            </div>
            {q.detail && t.answers[q.key] === 'yes' && (
              <div className="mt-3">
                {q.detail === 'integration_notes' ? (
                  <Textarea rows={2} value={t.integration_notes} onChange={(e) => set({ integration_notes: e.target.value })} placeholder="Which tools or services?" maxLength={5000} />
                ) : (
                  <Input
                    value={t[q.detail]}
                    onChange={(e) => set({ [q.detail!]: e.target.value } as Partial<TechnicalData>)}
                    placeholder={q.detail === 'domain_name' ? 'yourbrand.com' : 'e.g. GoDaddy, Hostinger, AWS, Vercel'}
                    maxLength={255}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Brand assets &amp; references</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Upload your logo, brand guidelines, photography, decks — anything that helps us understand your brand.</p>
        <AssetUploader />
      </section>

      <Field label="Anything else we should know?" optional className="mt-10">
        <Textarea rows={3} value={t.notes} onChange={(e) => set({ notes: e.target.value })} maxLength={5000} />
      </Field>
    </div>
  )
}
