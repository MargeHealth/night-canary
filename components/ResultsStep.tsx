'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OvernightChart } from './OvernightChart'
import { GPLetter } from './GPLetter'
import { MarkdownView } from './MarkdownView'
import { ReadAloudButton } from './ReadAloudButton'
import type { WizardCtx } from './Wizard'
import type { PulseOxReading } from '@/lib/pulseox/types'

type Scored = {
  odi: { odi: number; severity: string }
  spo2: { mean: number; min: number; t90: number }
  stopBang: { score: number; risk: string; positiveItems: string[] }
  epworth: { total: number; band: string }
  risk: { band: 'low' | 'moderate' | 'high'; reasons: string[] }
}

export function ResultsStep({ ctx }: { ctx: WizardCtx }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scored, setScored] = useState<Scored | null>(null)
  const [explanation, setExplanation] = useState<string>('')
  const [letter, setLetter] = useState<string>('')
  const [readings, setReadings] = useState<PulseOxReading[]>([])

  useEffect(() => {
    const run = async () => {
      if (!ctx.sessionId) return
      try {
        const r1 = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: ctx.sessionId }),
        })
        const d1 = await r1.json()
        if (d1.error) throw new Error(d1.error)
        setScored(d1.scored)
        setExplanation(d1.patientExplanation)

        const r2 = await fetch('/api/letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: ctx.sessionId }),
        })
        const d2 = await r2.json()
        if (d2.error) throw new Error(d2.error)
        setLetter(d2.letter)

        const r3 = await fetch(`/api/session-readings?sessionId=${ctx.sessionId}`)
        if (r3.ok) {
          const d3 = await r3.json()
          setReadings(d3.readings || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [ctx.sessionId])

  if (loading) return <p className="text-center text-slate-500">Analysing your results...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!scored) return null

  const bandColor =
    scored.risk.band === 'high' ? 'bg-red-100 text-red-800' :
    scored.risk.band === 'moderate' ? 'bg-amber-100 text-amber-800' :
    'bg-emerald-100 text-emerald-800'

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Overall risk</h3>
          <Badge className={bandColor + ' text-sm sm:text-base px-3 py-1'}>{scored.risk.band.toUpperCase()}</Badge>
        </div>
        <ul className="mt-3 list-disc list-inside text-sm text-slate-700 space-y-1">
          {scored.risk.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
          <Metric label="ODI" value={`${scored.odi.odi}/hr`} sub={scored.odi.severity} />
          <Metric label="Min SpO₂" value={`${scored.spo2.min}%`} sub={`T90 ${scored.spo2.t90}%`} />
          <Metric label="STOP-BANG" value={`${scored.stopBang.score}/8`} sub={scored.stopBang.risk} />
          <Metric label="Epworth" value={`${scored.epworth.total}/24`} sub={scored.epworth.band} />
        </div>
      </Card>

      {readings.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-900">Overnight oxygen trace</h3>
          <OvernightChart readings={readings} />
          <p className="text-xs text-slate-500 mt-2">The red dashed line marks 90% — sustained dips below it are clinically significant.</p>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-slate-900">What this means</h3>
          <ReadAloudButton text={explanation} label="Read summary" size="sm" className="w-auto min-w-32" />
        </div>
        <MarkdownView markdown={explanation} />
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold mb-3 text-slate-900">Letter for your GP</h3>
        <GPLetter markdown={letter} />
      </Card>

      <p className="text-xs text-slate-500 text-center">
        Not a diagnosis. Please discuss these results with a qualified clinician.
      </p>
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 capitalize">{sub}</div>
    </div>
  )
}
