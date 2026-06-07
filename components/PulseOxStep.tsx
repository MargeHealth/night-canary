'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Sparkles, Activity, Radio, Square } from 'lucide-react'
import type { WizardCtx } from './Wizard'
import type { PulseOxReading } from '@/lib/pulseox/types'
import {
  DEFAULT_MARGE_VITALS_WS_URL,
  parseMargeVitalsPayload,
  type MargeVitalsPayload,
} from '@/lib/pulseox/marge-relay'

type RelayStatus = 'idle' | 'connecting' | 'connected' | 'recording' | 'error'

const VITALS_WS_URL = process.env.NEXT_PUBLIC_VITALS_WS_URL || DEFAULT_MARGE_VITALS_WS_URL

export function PulseOxStep({ ctx }: { ctx: WizardCtx }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<number | null>(null)
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('idle')
  const [relayError, setRelayError] = useState<string | null>(null)
  const [latestPayload, setLatestPayload] = useState<MargeVitalsPayload | null>(null)
  const [latestReading, setLatestReading] = useState<PulseOxReading | null>(null)
  const [liveReadings, setLiveReadings] = useState<PulseOxReading[]>([])
  const [lastEvent, setLastEvent] = useState<string>('Not connected')
  const wsRef = useRef<WebSocket | null>(null)

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

  async function uploadReadings(readings: PulseOxReading[]) {
    if (readings.length < 5) {
      setRelayError('Collect at least 5 live readings before saving.')
      return
    }

    setBusy(true)
    setError(null)
    setRelayError(null)
    try {
      const res = await fetch('/api/oximetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: ctx.sessionId,
          oximetry: {
            startedAt: readings[0].timestamp,
            endedAt: readings[readings.length - 1].timestamp,
            readings,
          },
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUploaded(data.readingCount)
    } catch (err) {
      setRelayError(err instanceof Error ? err.message : 'failed to save live readings')
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

  function connectRelay() {
    setRelayError(null)
    setRelayStatus('connecting')
    setLastEvent('Connecting to Marge Health vitals relay...')

    const ws = new WebSocket(`${VITALS_WS_URL}?role=monitor`)
    wsRef.current = ws

    ws.onopen = () => {
      setRelayStatus('connected')
      setLastEvent('Connected. Send start when the ring is ready.')
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        const parsed = parseMargeVitalsPayload(data)
        if (!parsed) return

        setLatestPayload(parsed.payload)
        setLastEvent(parsed.reading ? 'Vitals packet received' : `Relay packet received: ${parsed.status}`)

        if (parsed.reading) {
          setLatestReading(parsed.reading)
          setLiveReadings(prev => {
            const next = [...prev, parsed.reading as PulseOxReading]
            return next.slice(-7200)
          })
        }
      } catch {
        setLastEvent('Ignored non-vitals relay message')
      }
    }

    ws.onerror = () => {
      setRelayStatus('error')
      setRelayError('Could not connect to the Marge Health vitals relay.')
    }

    ws.onclose = () => {
      setRelayStatus(current => current === 'error' ? 'error' : 'idle')
      setLastEvent('Disconnected from relay')
      wsRef.current = null
    }
  }

  function sendRelayCommand(command: 'start' | 'stop') {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setRelayError('Connect to the vitals relay first.')
      return
    }

    wsRef.current.send(JSON.stringify({ command }))
    setRelayStatus(command === 'start' ? 'recording' : 'connected')
    setLastEvent(command === 'start' ? 'Start command sent to ring' : 'Stop command sent to ring')
  }

  function disconnectRelay() {
    wsRef.current?.close()
    wsRef.current = null
    setRelayStatus('idle')
    setLastEvent('Disconnected from relay')
  }

  const canConnect = relayStatus === 'idle' || relayStatus === 'error'
  const connected = relayStatus === 'connected' || relayStatus === 'recording'
  const latestSpo2 = latestReading?.spo2 ?? null
  const latestPulse = latestReading?.pulseRate ?? null
  const estimatedCount = liveReadings.filter(r => r.estimated).length

  return (
    <Card className="p-6 space-y-4">
      <p className="text-slate-700">
        Upload an overnight pulse-oximeter recording (CSV with columns <code className="bg-slate-100 px-1 rounded text-xs">timestamp,spo2,pulse_rate</code>),
        or try a sample to see how it works.
      </p>

      <Button onClick={() => loadDemoSample('moderate-osa')} disabled={busy} size="lg" className="w-full">
        <Activity className="w-4 h-4 mr-2" />Use demo sleep sample
      </Button>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Live Marge Health ring</h3>
            <p className="text-xs text-slate-500">Streams ESP32/MAX30105 vitals from the Cloudflare relay.</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
            relayStatus === 'recording' ? 'bg-red-100 text-red-700' :
            connected ? 'bg-emerald-100 text-emerald-700' :
            relayStatus === 'connecting' ? 'bg-amber-100 text-amber-700' :
            relayStatus === 'error' ? 'bg-red-100 text-red-700' :
            'bg-white text-slate-500 border border-slate-200'
          }`}>
            {relayStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <LiveMetric label="SpO2" value={latestSpo2 === null ? '--' : `${latestSpo2}%`} sub={latestReading?.estimated ? 'estimate' : latestReading ? 'validated' : latestPayload?.spo2Status as string | undefined} />
          <LiveMetric label="Pulse" value={latestPulse === null ? '--' : `${latestPulse} bpm`} sub={latestPayload?.validReading === false ? 'no finger' : 'signal'} />
          <LiveMetric label="Samples" value={`${liveReadings.length}`} sub={estimatedCount > 0 ? `${estimatedCount} estimated` : undefined} />
          <LiveMetric label="Progress" value={latestPayload?.sampleProgress == null ? '--' : `${latestPayload.sampleProgress}/100`} sub={latestPayload?.spo2Status as string | undefined} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Button type="button" variant="outline" onClick={connectRelay} disabled={!canConnect}>
            <Radio className="w-4 h-4 mr-2" />Connect
          </Button>
          <Button type="button" variant="secondary" onClick={() => sendRelayCommand('start')} disabled={!connected}>
            Start ring
          </Button>
          <Button type="button" variant="outline" onClick={() => sendRelayCommand('stop')} disabled={!connected}>
            <Square className="w-4 h-4 mr-2" />Stop
          </Button>
          <Button type="button" variant="outline" onClick={disconnectRelay} disabled={!connected}>
            Disconnect
          </Button>
        </div>

        <Button type="button" onClick={() => uploadReadings(liveReadings)} disabled={busy || liveReadings.length < 5} className="w-full">
          Use live ring readings
        </Button>

        <div className="text-xs text-slate-500 space-y-1">
          <p>{lastEvent}</p>
          {latestReading?.estimated && <p>SpO2 is using the firmware estimate while the sensor calibrates. Strong finger placement improves validated readings.</p>}
          {relayError && <p className="text-red-600">{relayError}</p>}
        </div>
      </div>

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

function LiveMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 capitalize">{sub}</div>}
    </div>
  )
}
