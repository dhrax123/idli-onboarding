import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CloudOff, Loader2 } from 'lucide-react'
import { useOnboarding, type SaveState } from '@/hooks/useOnboarding'
import { Button, Spinner } from '@/components/ui'
import { BrandMark } from '@/components/BrandMark'
import { OnboardingContext, type OnboardingCtx } from '@/components/onboarding/shared'
import { BrandStep, BusinessStep, ProjectStep, WelcomeStep } from '@/components/onboarding/steps/basic'
import { FontStudioStep } from '@/components/onboarding/steps/FontStudio'
import { ColourStudioStep } from '@/components/onboarding/steps/ColourStudio'
import { LayoutStudioStep } from '@/components/onboarding/steps/LayoutStudio'
import { CompetitorsStep, InspirationStep } from '@/components/onboarding/steps/references'
import { TechnicalStep } from '@/components/onboarding/steps/Technical'
import { ReviewStep, SubmittedScreen } from '@/components/onboarding/steps/Review'
import { computeProgress, stepCompletion, STEPS, STUDIO_STEPS } from '@/lib/steps'
import { loadAllFonts } from '@/lib/fonts'
import { cn } from '@/lib/utils'

const STEP_COMPONENTS = [
  WelcomeStep, BusinessStep, ProjectStep, BrandStep, FontStudioStep, ColourStudioStep,
  LayoutStudioStep, InspirationStep, CompetitorsStep, TechnicalStep, ReviewStep,
]

function SaveIndicator({ state, retry }: { state: SaveState; retry: () => void }) {
  if (state === 'error')
    return (
      <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 text-[13px] text-danger">
        <CloudOff className="size-3.5" /> Not saved · Retry
      </button>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted" aria-live="polite">
      {state === 'saving' || state === 'dirty' ? (
        <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
      ) : state === 'saved' ? (
        <><Check className="size-3.5 text-success" /> Saved</>
      ) : (
        <><Check className="size-3.5" /> Autosave on</>
      )}
    </span>
  )
}

export function OnboardingPage() {
  const { token = '' } = useParams()
  const ctl = useOnboarding(token)

  useEffect(() => {
    loadAllFonts()
  }, [])

  useEffect(() => {
    if (ctl.payload) document.title = `${ctl.payload.client.company_name} · Onboarding · Idli Studios`
  }, [ctl.payload])

  if (ctl.loadError) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl border border-line bg-surface"><AlertTriangle className="size-5 text-muted" /></div>
          <h1 className="text-lg font-semibold">This link isn’t working</h1>
          <p className="mt-2 text-sm text-muted">{ctl.loadError} If you think this is a mistake, contact your Idli Studios project lead for a new link.</p>
          <Button asChild variant="outline" className="mt-6"><a href="mailto:hello@idlistudios.com">Contact Idli Studios</a></Button>
        </div>
      </div>
    )
  }

  if (!ctl.payload || !ctl.data) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <BrandMark />
          <Spinner className="text-muted" />
        </div>
      </div>
    )
  }

  const ctx: OnboardingCtx = { ...ctl, token, payload: ctl.payload, data: ctl.data }
  const { step, goTo, data, submitted } = ctx
  const StepComponent = STEP_COMPONENTS[step]
  const isStudio = STUDIO_STEPS.includes(STEPS[step].id)
  const done = stepCompletion(data)
  const progress = submitted ? 100 : computeProgress(data, ctl.maxVisited)

  return (
    <OnboardingContext.Provider value={ctx}>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark />
              <span className="hidden h-5 w-px bg-line sm:block" />
              <span className="hidden truncate text-sm text-muted sm:block">{ctx.payload.client.company_name} · {ctx.payload.session.project_name}</span>
            </div>
            <div className="flex items-center gap-4">
              {!submitted && step > 0 && <SaveIndicator state={ctl.saveState} retry={ctl.retry} />}
              {!submitted && <span className="hidden font-mono text-xs text-muted sm:block">{progress}%</span>}
            </div>
          </div>
          {!submitted && (
            <div className="h-[2px] bg-line/60">
              <div className="h-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${Math.max(progress, step === 0 ? 0 : 3)}%` }} />
            </div>
          )}
        </header>

        {submitted ? (
          <main className="px-4 sm:px-6"><SubmittedScreen /></main>
        ) : (
          <div className={cn('mx-auto flex max-w-[1440px] gap-10 px-4 sm:px-6', step === 0 && 'block')}>
            {/* Step rail */}
            {step > 0 && (
              <nav aria-label="Onboarding steps" className="sticky top-24 hidden h-fit w-52 shrink-0 py-10 xl:block">
                <ol className="flex flex-col gap-0.5">
                  {STEPS.slice(1).map((s, i) => {
                    const n = i + 1
                    const current = n === step
                    const complete = done[s.id] && n <= ctl.maxVisited && n !== step
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => goTo(n)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                            current ? 'bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-muted hover:bg-subtle hover:text-ink',
                          )}
                        >
                          <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-medium', current ? 'border-ink bg-ink text-white' : complete ? 'border-ink/20 bg-ink/5 text-ink' : 'border-line-strong')}>
                            {complete ? <Check className="size-3" strokeWidth={3} /> : n}
                          </span>
                          {s.short}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </nav>
            )}

            <main key={step} className={cn('min-w-0 flex-1 animate-fade-up pb-36', step > 0 && 'pt-10 sm:pt-14', !isStudio && step > 0 && 'xl:pr-52')}>
              <StepComponent />
            </main>
          </div>
        )}

        {/* Footer nav */}
        {!submitted && step > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 backdrop-blur-md">
            <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
              <Button variant="ghost" onClick={() => goTo(step - 1)}>
                <ArrowLeft /> Back
              </Button>
              <span className="text-[13px] text-muted xl:hidden">{step} / {STEPS.length - 1} · {STEPS[step].short}</span>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => goTo(step + 1)}>
                  <span className="hidden sm:inline">{step === STEPS.length - 2 ? 'Review brief' : `Next: ${STEPS[step + 1].short}`}</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight />
                </Button>
              ) : (
                <span className="w-20" />
              )}
            </div>
          </div>
        )}
      </div>
    </OnboardingContext.Provider>
  )
}
