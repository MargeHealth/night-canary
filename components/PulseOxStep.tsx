'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Sparkles, Activity } from 'lucide-react'
import type { WizardCtx } from './Wizard'

export function PulseOxStep({ ctx }: { ctx: WizardCtx }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<number | null>(null)

  async function upload(csv: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/oximetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: ctx.sessionId, csv }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUploaded(data.readingCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function loadDemoSample(name: 'normal' | 'moderate-osa') {
    setBusy(true)
    try {
      const res = await fetch(`/samples/${name === 'normal' ? 'normal-night.csv' : 'moderate-osa-night.csv'}`)
      const csv = await res.text()
      await upload(csv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'sample load failed')
      setBusy(false)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const csv = await f.text()
    await upload(csv)
  }

  return (
    <Card className="p-6 space-y-4">
      <p className="text-slate-700">
        Upload an overnight pulse-oximeter recording (CSV with columns <code className="bg-slate-100 px-1 rounded text-xs">timestamp,spo2,pulse_rate</code>),
        or try a sample to see how it works.
      </p>

      <Button onClick={() => loadDemoSample('moderate-osa')} disabled={busy} size="lg" className="w-full">
        <Activity className="w-4 h-4 mr-2" />Use demo sleep sample
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <input type="file" accept=".csv" onChange={onFile} className="hidden" />
          <span className="cursor-pointer block">
            <span className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium rounded-md border border-slate-300 bg-white text-slate-900 hover:bg-slate-50">
              <Upload className="w-4 h-4 mr-2" />Upload CSV
            </span>
          </span>
        </label>
        <Button variant="secondary" onClick={() => loadDemoSample('normal')} disabled={busy}>
          <Sparkles className="w-4 h-4 mr-2" />Use normal sample
        </Button>
      </div>

      {busy && <p className="text-sm text-slate-500">Uploading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {uploaded !== null && !busy && (
        <>
          <p className="text-sm text-emerald-700">Loaded {uploaded} readings.</p>
          <Button onClick={ctx.next} className="w-full">See your results</Button>
        </>
      )}
    </Card>
  )
}
