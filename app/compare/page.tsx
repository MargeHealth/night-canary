'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OvernightChart } from '@/components/OvernightChart'
import { loadSample } from '@/lib/pulseox/sample-data'
import { computeOdi } from '@/lib/clinical/odi'
import { computeSpo2Stats } from '@/lib/clinical/spo2-stats'
import type { OvernightSession } from '@/lib/pulseox/types'
import { ArrowRight, CheckCircle2, AlertTriangle, Moon } from 'lucide-react'

type Analysed = {
  session: OvernightSession
  odi: number
  odiSeverity: string
  meanSpo2: number
  minSpo2: number
  t90: number
  desatEvents: number
}

async function analyse(name: 'normal' | 'moderate-osa'): Promise<Analysed> {
  const session = await loadSample(name)
  const odi = computeOdi(session.readings)
  const spo2 = computeSpo2Stats(session.readings)
  return {
    session,
    odi: odi.odi,
    odiSeverity: odi.severity,
    desatEvents: odi.events.length,
    meanSpo2: spo2.mean,
    minSpo2: spo2.min,
    t90: spo2.t90,
  }
}

export default function ComparePage() {
  const [healthy, setHealthy] = useState<Analysed | null>(null)
  const [osa, setOsa] = useState<Analysed | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([analyse('normal'), analyse('moderate-osa')])
      .then(([h, o]) => { setHealthy(h); setOsa(o) })
      .catch(e => setError(e instanceof Error ? e.message : 'failed to load samples'))
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-slate-500 mb-3">
          <Moon className="w-5 h-5" />
          <span className="text-sm font-medium">NightCanary</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
          What does sleep apnoea actually look like?
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl">
          Two real overnight oxygen recordings, eight hours each, plotted at the same scale.
          The red dashed line is 90% — the threshold below which oxygen is considered clinically low.
        </p>

        {error && <p className="text-red-600 mt-6">{error}</p>}

        {!error && (!healthy || !osa) && (
          <p className="text-slate-500 mt-10">Loading samples…</p>
        )}

        {healthy && osa && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Healthy */}
              <Card className="p-5 sm:p-6 border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-900">A healthy night</h2>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Normal</Badge>
                </div>
                <OvernightChart readings={healthy.session.readings} />
                <Metrics a={healthy} tone="ok" />
                <p className="text-sm text-slate-600 mt-3">
                  Oxygen sits comfortably above 95% all night. Tiny natural fluctuations only.
                  No clinically significant drops.
                </p>
              </Card>

              {/* OSA */}
              <Card className="p-5 sm:p-6 border-amber-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-slate-900">A moderate-OSA night</h2>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">Concerning pattern</Badge>
                </div>
                <OvernightChart readings={osa.session.readings} />
                <Metrics a={osa} tone="warn" />
                <p className="text-sm text-slate-600 mt-3">
                  Repeated dips below 90%, sometimes below 85%. Each dip is the airway briefly
                  blocking and the body fighting to recover.
                </p>
              </Card>
            </div>

            {/* Side-by-side comparison row */}
            <Card className="p-6 mt-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Why this matters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Compare label="Desaturation events per hour (ODI)" healthy={healthy.odi.toFixed(1)} osa={osa.odi.toFixed(1)} />
                <Compare label="Lowest oxygen reading" healthy={`${healthy.minSpo2}%`} osa={`${osa.minSpo2}%`} />
                <Compare label="Time below 90% (T90)" healthy={`${healthy.t90}%`} osa={`${osa.t90}%`} />
              </div>
              <p className="text-xs text-slate-500 mt-5 leading-relaxed">
                ODI &lt; 5/hr is normal. 5–14.9 is mild OSA, 15–29.9 moderate, ≥30 severe (AASM 2017, NICE NG202).
                The OSA recording on the right has an ODI of {osa.odi.toFixed(1)}/hr — that is a clinical referral threshold.
              </p>
            </Card>

            <Card className="p-6 mt-6 bg-slate-900 text-white border-slate-900">
              <h3 className="text-xl font-semibold">Worried this might be you?</h3>
              <p className="mt-2 text-slate-300 max-w-2xl">
                85% of UK adults with sleep apnoea don&apos;t know they have it.
                The check takes 5 minutes and produces a structured letter you can take to your GP.
              </p>
              <Link href="/assess" className="inline-block mt-5">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Take the 5-minute check
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}

function Metrics({ a, tone }: { a: Analysed; tone: 'ok' | 'warn' }) {
  const valueClass = tone === 'warn' ? 'text-amber-700' : 'text-emerald-700'
  return (
    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
      <Metric label="ODI" value={`${a.odi.toFixed(1)}/hr`} sub={a.odiSeverity} valueClass={valueClass} />
      <Metric label="Min SpO₂" value={`${a.minSpo2}%`} sub={`T90 ${a.t90}%`} valueClass={valueClass} />
      <Metric label="Mean SpO₂" value={`${a.meanSpo2}%`} sub={`${a.desatEvents} events`} valueClass={valueClass} />
    </div>
  )
}

function Metric({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-base font-semibold ${valueClass}`}>{value}</div>
      <div className="text-[10px] text-slate-500 capitalize">{sub}</div>
    </div>
  )
}

function Compare({ label, healthy, osa }: { label: string; healthy: string; osa: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-emerald-700 mb-0.5">Healthy</div>
          <div className="text-2xl font-semibold text-slate-900">{healthy}</div>
        </div>
        <div className="text-slate-300">vs</div>
        <div className="flex-1">
          <div className="text-xs text-amber-700 mb-0.5">OSA</div>
          <div className="text-2xl font-semibold text-slate-900">{osa}</div>
        </div>
      </div>
    </div>
  )
}
