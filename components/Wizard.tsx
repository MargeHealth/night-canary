'use client'
import { useState, ReactNode } from 'react'
import { Progress } from '@/components/ui/progress'
import { BrandLogo } from '@/components/BrandLogo'
import { ChevronLeft } from 'lucide-react'

export type WizardCtx = {
  next: () => void
  prev: () => void
  sessionId: string | null
  setSessionId: (id: string) => void
}

export type WizardStep = {
  title: string
  render: (ctx: WizardCtx) => ReactNode
}

export function Wizard({ steps }: { steps: WizardStep[] }) {
  const [idx, setIdx] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const current = steps[idx]
  const ctx: WizardCtx = {
    next: () => setIdx(i => Math.min(i + 1, steps.length - 1)),
    prev: () => setIdx(i => Math.max(i - 1, 0)),
    sessionId,
    setSessionId,
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BrandLogo compact subtitle="Assessment" />
          <span className="hidden rounded-full border border-teal-100 bg-white px-3 py-1 text-xs font-medium text-teal-800 shadow-sm sm:inline-flex">
            GP-ready screening
          </span>
        </div>
        <Progress value={((idx + 1) / steps.length) * 100} className="mb-6" />

        {idx > 0 && (
          <button
            onClick={ctx.prev}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-3 -ml-1 px-1 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <h2 className="text-2xl font-semibold mb-2 text-slate-900">{current.title}</h2>
        <p className="text-sm text-slate-500 mb-6">Step {idx + 1} of {steps.length}</p>
        {current.render(ctx)}
      </div>
    </div>
  )
}
