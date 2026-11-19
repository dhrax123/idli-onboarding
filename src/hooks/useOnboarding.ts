import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchOnboarding, saveOnboarding, submitOnboarding } from '@/lib/onboarding-api'
import { computeProgress } from '@/lib/steps'
import type { AssetRecord, OnboardingData, OnboardingPayload } from '@/lib/types'
import { friendlyError } from '@/lib/utils'

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY = 900

function pickData(p: OnboardingPayload): OnboardingData {
  const { business, project, brand, typography, colours, layout, inspiration, competitors, technical } = p
  return { business, project, brand, typography, colours, layout, inspiration, competitors, technical }
}

export function useOnboarding(token: string) {
  const [payload, setPayload] = useState<OnboardingPayload | null>(null)
  const [data, setData] = useState<OnboardingData | null>(null)
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [maxVisited, setMaxVisited] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const dataRef = useRef<OnboardingData | null>(null)
  const stepRef = useRef(0)
  const maxRef = useRef(0)
  const dirtyRef = useRef(false)
  const inFlight = useRef<Promise<void> | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lockedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetchOnboarding(token)
      .then((p) => {
        if (cancelled) return
        setPayload(p)
        const d = pickData(p)
        setData(d)
        dataRef.current = d
        setAssets(p.assets)
        const locked = !['not_started', 'in_progress'].includes(p.session.status)
        lockedRef.current = locked
        setSubmitted(locked)
        const resume = locked ? 10 : Math.min(p.session.current_step ?? 0, 10)
        setStep(resume)
        stepRef.current = resume
        setMaxVisited(resume)
        maxRef.current = resume
      })
      .catch((e) => !cancelled && setLoadError(friendlyError(e)))
    return () => {
      cancelled = true
    }
  }, [token])

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (lockedRef.current || !dataRef.current) return
    if (inFlight.current) await inFlight.current
    if (!dirtyRef.current) return
    dirtyRef.current = false
    setSaveState('saving')
    const snapshot = dataRef.current
    const progress = computeProgress(snapshot, maxRef.current)
    const run = saveOnboarding(token, snapshot, stepRef.current, progress)
      .then(() => {
        setSavedAt(new Date())
        setSaveState(dirtyRef.current ? 'dirty' : 'saved')
      })
      .catch((e) => {
        dirtyRef.current = true
        setSaveState('error')
        if (String(e?.message).includes('already_submitted')) {
          lockedRef.current = true
          setSubmitted(true)
        }
      })
      .finally(() => {
        inFlight.current = null
      })
    inFlight.current = run
    await run
  }, [token])

  const schedule = useCallback(() => {
    dirtyRef.current = true
    setSaveState('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY)
  }, [flush])

  /** Update one section of the onboarding data. Triggers autosave. */
  const update = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K] | ((prev: OnboardingData[K]) => OnboardingData[K])) => {
      if (lockedRef.current) return
      setData((prev) => {
        if (!prev) return prev
        const nextVal = typeof value === 'function' ? (value as (p: OnboardingData[K]) => OnboardingData[K])(prev[key]) : value
        const next = { ...prev, [key]: nextVal }
        dataRef.current = next
        return next
      })
      schedule()
    },
    [schedule],
  )

  const goTo = useCallback(
    (n: number) => {
      const target = Math.max(0, Math.min(10, n))
      setStep(target)
      stepRef.current = target
      if (target > maxRef.current) {
        maxRef.current = target
        setMaxVisited(target)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (!lockedRef.current && target > 0) {
        dirtyRef.current = true
        void flush()
      }
    },
    [flush],
  )

  const retry = useCallback(() => {
    dirtyRef.current = true
    void flush()
  }, [flush])

  const submit = useCallback(async () => {
    await flush()
    if (dirtyRef.current) throw new Error('Your latest changes have not saved yet. Please try again.')
    await submitOnboarding(token)
    lockedRef.current = true
    setSubmitted(true)
  }, [flush, token])

  // Save when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current) void flush()
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || inFlight.current) {
        void flush()
        e.preventDefault()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [flush])

  return {
    payload,
    data,
    assets,
    setAssets,
    loadError,
    step,
    maxVisited,
    goTo,
    update,
    saveState,
    savedAt,
    retry,
    submitted,
    submit,
    flush,
  }
}

export type OnboardingController = ReturnType<typeof useOnboarding>
