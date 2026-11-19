import { useState } from 'react'
import { AlertCircle, ArrowRight, Check, Send } from 'lucide-react'
import { toast } from 'sonner'
import { BriefSummary } from '@/components/brief/BriefSummary'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { Button, Spinner } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { missingForSubmit, STEPS } from '@/lib/steps'
import { friendlyError } from '@/lib/utils'
import { designConfigFrom, StepHeader, useOnb } from '../shared'

export function ReviewStep() {
  const ctx = useOnb()
  const { data, assets, goTo, submit, payload } = ctx
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const missing = missingForSubmit(data)

  async function doSubmit() {
    setBusy(true)
    try {
      await submit()
      setConfirm(false)
      window.scrollTo({ top: 0 })
    } catch (e) {
      toast.error('Could not submit', { description: friendlyError(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <StepHeader index={10} title="Review your brief" description="Here’s everything you’ve shared. Edit anything you like — nothing is final until you press submit." />

      {missing.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-warn"><AlertCircle className="size-4" /> A few things are needed before you can submit</div>
          <ul className="mt-2 flex flex-col gap-1">
            {missing.map((m) => (
              <li key={m.message}>
                <button type="button" onClick={() => goTo(m.step)} className="text-left text-sm text-ink-2 underline decoration-amber-300 underline-offset-4 hover:decoration-ink">
                  {m.message} <span className="text-muted">— {STEPS[m.step].label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8">
        <PreviewPanel config={designConfigFrom(data, payload.client.company_name)} />
      </div>

      <BriefSummary data={data} assets={assets} onEdit={goTo} />

      <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
        <h2 className="font-display text-[36px] leading-tight">Ready when you are.</h2>
        <p className="max-w-md text-sm text-muted">Once submitted, the Idli Studios team receives your complete brief and your answers are locked. We’ll be in touch within two working days.</p>
        <Button size="lg" disabled={missing.length > 0} onClick={() => setConfirm(true)}>
          Submit my brief <Send />
        </Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Submit your brief?" description="You won’t be able to make changes after submitting. If you need to change something later, just tell us.">
          <div className="flex justify-end gap-2 px-6 py-5">
            <Button variant="outline" onClick={() => setConfirm(false)} disabled={busy}>Keep editing</Button>
            <Button onClick={doSubmit} disabled={busy}>{busy ? <Spinner /> : <Check />} Yes, submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SubmittedScreen() {
  const { payload, data, assets } = useOnb()
  const [showBrief, setShowBrief] = useState(false)
  const first = (payload.client.contact_name ?? '').split(' ')[0]
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="flex flex-col items-center text-center animate-fade-up">
        <div className="relative mb-8 grid size-16 place-items-center rounded-full bg-ink text-white">
          <Check className="size-7" strokeWidth={2.5} />
          <span className="absolute inset-0 animate-ping rounded-full bg-ink/20 [animation-iteration-count:2]" />
        </div>
        <h1 className="font-display text-[48px] leading-[1.02] sm:text-[64px]">Thank you{first ? `, ${first}` : ''}.</h1>
        <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
          Your brief for <b className="font-medium text-ink">{payload.session.project_name}</b> is with the Idli Studios team. We’ll review everything and reach out within two working days with next steps.
        </p>
        <div className="mt-10 grid w-full max-w-xl gap-px overflow-hidden rounded-xl border border-line bg-line text-left sm:grid-cols-3">
          {[
            ['01', 'We review', 'Our designers study your brief and references.'],
            ['02', 'Kick-off call', 'We align on scope, timeline and direction.'],
            ['03', 'First concepts', 'You see the first design directions.'],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-surface p-4">
              <div className="font-mono text-xs text-muted">{n}</div>
              <div className="mt-2 text-sm font-medium">{t}</div>
              <div className="mt-1 text-[13px] text-muted">{d}</div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-8" onClick={() => setShowBrief((v) => !v)}>
          {showBrief ? 'Hide' : 'View'} what you submitted <ArrowRight />
        </Button>
      </div>
      {showBrief && (
        <div className="mt-10 animate-fade-up">
          <BriefSummary data={data} assets={assets} />
        </div>
      )}
    </div>
  )
}
