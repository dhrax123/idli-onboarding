import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Input, Segmented } from '@/components/ui'
import { OnboardingContext, type OnboardingCtx } from '@/components/onboarding/shared'
import { FontStudioStep } from '@/components/onboarding/steps/FontStudio'
import { ColourStudioStep } from '@/components/onboarding/steps/ColourStudio'
import { LayoutStudioStep } from '@/components/onboarding/steps/LayoutStudio'
import { emptyOnboardingData } from '@/lib/options'
import { loadAllFonts } from '@/lib/fonts'
import type { OnboardingData, OnboardingPayload } from '@/lib/types'

type Tab = 'fonts' | 'colours' | 'layout'

/**
 * A stand-alone, in-memory design studio. Useful for sales calls and for
 * trying the studio without a client session. Nothing here is persisted,
 * and the page says so.
 */
export function PlaygroundPage() {
  const [data, setData] = useState<OnboardingData>(() => emptyOnboardingData('Northbound'))
  const [tab, setTab] = useState<Tab>('fonts')

  useEffect(() => loadAllFonts(), [])

  const update = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K] | ((prev: OnboardingData[K]) => OnboardingData[K])) => {
    setData((prev) => ({ ...prev, [key]: typeof value === 'function' ? (value as (p: OnboardingData[K]) => OnboardingData[K])(prev[key]) : value }))
  }, [])

  const payload = {
    ...data,
    session: { id: 'playground', project_name: 'Design playground', slug: 'playground', status: 'in_progress', current_step: 4, progress: 0, welcome_message: null, submitted_at: null, last_activity_at: null, created_at: '', updated_at: '' },
    client: { company_name: data.business.company_name, contact_name: null },
    assets: [],
  } satisfies OnboardingPayload

  const noop = async () => {}
  const ctx: OnboardingCtx = {
    token: 'playground', payload, data, update, assets: [], setAssets: () => {}, loadError: null,
    step: 4, maxVisited: 10, goTo: () => {}, saveState: 'idle', savedAt: null, retry: () => {}, submitted: false, submit: noop, flush: noop,
  }

  return (
    <OnboardingContext.Provider value={ctx}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="grid size-8 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink" aria-label="Back"><ArrowLeft className="size-4" /></Link>
              <BrandMark />
            </div>
            <Segmented value={tab} onChange={setTab} options={[{ value: 'fonts', label: 'Fonts' }, { value: 'colours', label: 'Colours' }, { value: 'layout', label: 'Layout' }]} />
          </div>
        </header>
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[13px] text-warn">
          Design playground — changes here are not saved. Send clients their onboarding link to capture their choices.
        </div>
        <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6">
          <div className="mb-8 flex max-w-sm flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted" htmlFor="pg-name">Brand name in preview</label>
            <Input id="pg-name" value={data.business.company_name} onChange={(e) => update('business', (b) => ({ ...b, company_name: e.target.value }))} className="h-10" />
          </div>
          {tab === 'fonts' && <FontStudioStep />}
          {tab === 'colours' && <ColourStudioStep />}
          {tab === 'layout' && <LayoutStudioStep />}
        </main>
      </div>
    </OnboardingContext.Provider>
  )
}
