'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Download,
  Heart,
  Play,
  Radio,
  Square,
  Trash2,
} from 'lucide-react'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrandLogo } from '@/components/BrandLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { computeOdi } from '@/lib/clinical/odi'
import { computeSpo2Stats } from '@/lib/clinical/spo2-stats'
import { downloadCsv } from '@/lib/pulseox/csv-export'
import { parseCsv } from '@/lib/pulseox/csv'
import { connectMargeVitalsSerial, type SerialLike } from '@/lib/pulseox/serial'
import {
  DEFAULT_MARGE_VITALS_WS_URL,
  parseMargeVitalsPayload,
  type MargeVitalsPayload,
  type MargeVitalsReading,
} from '@/lib/pulseox/marge-relay'
import type { PulseOxReading } from '@/lib/pulseox/types'

type RelayStatus = 'idle' | 'connecting' | 'connected' | 'recording' | 'error'

type PacketRow = {
  timestamp: number
  payload: MargeVitalsPayload
  parsed: MargeVitalsReading
}

const VITALS_WS_URL = process.env.NEXT_PUBLIC_VITALS_WS_URL || DEFAULT_MARGE_VITALS_WS_URL

export function ScreeningDashboard() {
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('idle')
  const [relayError, setRelayError] = useState<string | null>(null)
  const [usbStatus, setUsbStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [usbError, setUsbError] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState('Not connected')
  const [latest, setLatest] = useState<MargeVitalsReading | null>(null)
  const [readings, setReadings] = useState<PulseOxReading[]>([])
  const [packets, setPackets] = useState<PacketRow[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const serialRef = useRef<SerialLike | null>(null)
  const demoLoadedRef = useRef(false)

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      void serialRef.current?.close()
    }
  }, [])

  const connected = relayStatus === 'connected' || relayStatus === 'recording'
  const canConnect = relayStatus === 'idle' || relayStatus === 'error'
  const stats = useMemo(() => readings.length > 0 ? computeSpo2Stats(readings) : null, [readings])
  const odi = useMemo(() => readings.length > 30 ? computeOdi(readings) : null, [readings])
  const latestPayload = latest?.payload
  const validReading = latestPayload?.validReading === true
  const noFinger = latestPayload?.validReading === false
  const estimatedCount = readings.filter(r => r.estimated).length

  const ingestPacket = useCallback((parsed: MargeVitalsReading, source: 'relay' | 'usb') => {
    setLatest(parsed)
    setLastEvent(parsed.reading ? `Vitals packet received by ${source.toUpperCase()}` : `${source.toUpperCase()} packet received: ${parsed.status}`)
    setPackets(prev => [{ timestamp: Date.now(), payload: parsed.payload, parsed }, ...prev].slice(0, 12))

    if (parsed.reading) {
      setReadings(prev => [...prev, parsed.reading as PulseOxReading].slice(-7200))
    }
  }, [])

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

        ingestPacket(parsed, 'relay')
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

  async function connectUsb() {
    setUsbError(null)
    setUsbStatus('connecting')
    setLastEvent('Choose the XIAO ESP32C3 USB serial port.')

    try {
      const port = await connectMargeVitalsSerial(
        packet => ingestPacket(packet, 'usb'),
        line => {
          if (line.includes('WiFi connection failed')) {
            setLastEvent('USB connected. Firmware is in USB mode while Wi-Fi relay is unavailable.')
          }
        }
      )
      serialRef.current = port
      setUsbStatus('connected')
      setLastEvent('USB serial connected. Waiting for firmware vitals JSON.')
    } catch (err) {
      setUsbStatus('error')
      setUsbError(err instanceof Error ? err.message : 'USB serial connection failed')
    }
  }

  async function disconnectUsb() {
    try {
      await serialRef.current?.close()
    } catch {}
    serialRef.current = null
    setUsbStatus('idle')
    setLastEvent('Disconnected from USB serial')
  }

  const applyDemoReadings = useCallback((sample: PulseOxReading[]) => {
    const last = sample[sample.length - 1]

    setReadings(sample)
    setPackets([])
    setLatest({
      payload: {
        spo2: last?.spo2,
        spo2Valid: true,
        avgBpm: last?.pulseRate,
        validReading: true,
        spo2Status: 'valid',
      },
      reading: last ?? null,
      displaySpo2: last?.spo2 ?? null,
      displayPulse: last?.pulseRate ?? null,
      estimated: false,
      status: 'valid',
    })
    setLastEvent('Loaded demo moderate-OSA oxygen pattern')
  }, [])

  const loadDemoPattern = useCallback(async () => {
    setRelayError(null)
    const res = await fetch('/samples/moderate-osa-night.csv')
    const csv = await res.text()
    const now = Date.now()
    const sample = parseCsv(csv).map((reading, index) => ({
      ...reading,
      timestamp: now + index * 4000,
      source: 'sample' as const,
    }))
    applyDemoReadings(sample)
  }, [applyDemoReadings])

  useEffect(() => {
    if (demoLoadedRef.current) return
    if (new URLSearchParams(window.location.search).get('demo') !== '1') return

    demoLoadedRef.current = true
    const timer = window.setTimeout(() => {
      void loadDemoPattern()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDemoPattern])

  function clearReadings() {
    setReadings([])
    setPackets([])
    setLatest(null)
    setLastEvent(connected ? 'Connected. Waiting for vitals packets.' : 'Readings cleared')
  }

  function exportReadings() {
    downloadCsv(readings, `nightcanary-screening-${new Date().toISOString().slice(0, 16).replace('T', '_')}.csv`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo compact subtitle="Live screening" />
          <div className="flex items-center gap-2">
            <Link href="/assess" className="hidden sm:block">
              <Button variant="outline" size="sm">Assessment</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={connectUsb} disabled={usbStatus === 'connecting' || usbStatus === 'connected'}>
              USB
            </Button>
            <Button size="sm" onClick={connectRelay} disabled={!canConnect}>
              <Radio className="mr-2 h-3.5 w-3.5" />
              Connect
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <Badge className={statusBadgeClass(relayStatus)}>{relayStatus}</Badge>
            {usbStatus === 'connected' && <Badge className="ml-2 bg-teal-100 text-teal-800">usb</Badge>}
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Live sleep screening monitor
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Show the Marge Health ring stream separately from the assessment flow. The page listens to the
              Cloudflare vitals relay, displays sensor confidence, and keeps a running SpO2 trace for the demo.
            </p>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <LiveMetric
                label="SpO2"
                value={latest?.displaySpo2 == null ? '--' : `${latest.displaySpo2}%`}
                sub={latest?.estimated ? 'estimate' : latest?.status}
                tone={latest?.displaySpo2 != null && latest.displaySpo2 < 90 ? 'bad' : 'brand'}
              />
              <LiveMetric
                label="Pulse"
                value={latest?.displayPulse == null ? '--' : `${Math.round(latest.displayPulse)} bpm`}
                sub="rate"
              />
              <LiveMetric
                label="IR signal"
                value={formatSignal(latestPayload?.ir)}
                sub={noFinger ? 'no finger' : validReading ? 'finger detected' : 'waiting'}
                tone={noFinger ? 'warn' : validReading ? 'ok' : 'neutral'}
              />
              <LiveMetric
                label="Samples"
                value={readings.length.toString()}
                sub={estimatedCount > 0 ? `${estimatedCount} estimated` : 'validated stream'}
              />
            </div>
          </Card>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Incoming oxygen trace</h2>
                <p className="text-xs text-slate-500">Reference line marks the 90% clinical low-oxygen threshold.</p>
              </div>
              <span className="text-xs font-medium text-slate-500">{lastEvent}</span>
            </div>
            <LiveScreeningChart readings={readings} />
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-950">Screening summary</h2>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Mean SpO2" value={stats ? `${stats.mean}%` : '--'} />
              <SummaryRow label="Min SpO2" value={stats ? `${stats.min}%` : '--'} tone={stats && stats.min < 90 ? 'bad' : undefined} />
              <SummaryRow label="T90" value={stats ? `${stats.t90}%` : '--'} />
              <SummaryRow label="ODI" value={odi ? `${odi.odi}/hr` : '--'} sub={odi?.severity} />
              <SummaryRow label="Packets" value={packets.length ? `${packets.length} recent` : '--'} />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              This page is for live demo screening only. NightCanary still treats the GP letter as the clinical handoff.
            </p>
          </Card>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Button onClick={() => sendRelayCommand('start')} disabled={!connected} className="lg:col-span-1">
            <Play className="mr-2 h-4 w-4" />
            Start ring
          </Button>
          <Button variant="outline" onClick={() => sendRelayCommand('stop')} disabled={!connected} className="lg:col-span-1">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
          <Button variant="outline" onClick={disconnectRelay} disabled={!connected} className="lg:col-span-1">
            Disconnect
          </Button>
          <Button variant="outline" onClick={usbStatus === 'connected' ? disconnectUsb : connectUsb} disabled={usbStatus === 'connecting'} className="lg:col-span-1">
            {usbStatus === 'connected' ? 'Disconnect USB' : 'Connect USB'}
          </Button>
          <Button variant="secondary" onClick={loadDemoPattern} className="lg:col-span-1">
            <Activity className="mr-2 h-4 w-4" />
            Demo pattern
          </Button>
          <Button variant="outline" onClick={exportReadings} disabled={readings.length === 0} className="lg:col-span-1">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" onClick={clearReadings} disabled={readings.length === 0 && packets.length === 0} className="lg:col-span-1">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </section>

        {relayError && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {relayError}
          </Card>
        )}
        {usbError && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {usbError}
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold text-slate-950">Recent relay packets</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">SpO2</th>
                    <th className="px-4 py-3 font-medium">Pulse</th>
                    <th className="px-4 py-3 font-medium">IR</th>
                    <th className="px-4 py-3 font-medium">Red</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        Connect the ring or load the demo pattern to show readings.
                      </td>
                    </tr>
                  ) : packets.map(packet => (
                    <tr key={packet.timestamp} className="bg-white">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatTime(packet.timestamp)}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-950">{formatSpo2(packet.parsed)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{formatPulse(packet.parsed)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{formatSignal(packet.payload.ir)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{formatSignal(packet.payload.red)}</td>
                      <td className="px-4 py-3 text-slate-600">{packet.parsed.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-teal-700">
              <Heart className="h-4 w-4" />
              <h2 className="text-base font-semibold">Demo path</h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. Connect the Marge Health ring relay.</li>
              <li>2. Press Start ring and place a finger over the MAX30105 sensor.</li>
              <li>3. Watch SpO2, pulse, IR signal, and packets update live.</li>
              <li>4. Continue to the assessment when the story is clear.</li>
            </ol>
            <Link href="/assess" className="mt-5 block">
              <Button className="w-full">
                Continue to assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </section>
      </div>
    </main>
  )
}

function LiveScreeningChart({ readings }: { readings: PulseOxReading[] }) {
  const stride = Math.max(1, Math.floor(readings.length / 600))
  const visible = readings.filter((_, index) => index % stride === 0).map(reading => ({
    time: formatTime(reading.timestamp),
    spo2: reading.spo2,
    pulse: reading.pulseRate,
  }))

  if (visible.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Waiting for live SpO2 readings
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer minWidth={0}>
        <LineChart data={visible}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={44} />
          <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} width={32} />
          <Tooltip />
          <ReferenceLine y={90} stroke="#dc2626" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="spo2" stroke="#0f766e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function LiveMetric({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'bad'
}) {
  const color = {
    neutral: 'text-slate-950',
    brand: 'text-teal-700',
    ok: 'text-emerald-700',
    warn: 'text-amber-700',
    bad: 'text-red-600',
  }[tone]

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] capitalize text-slate-500">{sub}</div>}
    </div>
  )
}

function SummaryRow({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'bad' }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {sub && <div className="text-xs capitalize text-slate-500">{sub}</div>}
      </div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'bad' ? 'text-red-600' : 'text-slate-950'}`}>
        {value}
      </div>
    </div>
  )
}

function statusBadgeClass(status: RelayStatus) {
  if (status === 'recording') return 'bg-red-100 text-red-700'
  if (status === 'connected') return 'bg-emerald-100 text-emerald-700'
  if (status === 'connecting') return 'bg-amber-100 text-amber-700'
  if (status === 'error') return 'bg-red-100 text-red-700'
  return 'bg-white text-slate-500 border border-slate-200'
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatSignal(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value).toLocaleString('en-GB') : '--'
}

function formatSpo2(parsed: MargeVitalsReading) {
  return parsed.displaySpo2 == null ? '--' : `${parsed.displaySpo2}%${parsed.estimated ? ' est.' : ''}`
}

function formatPulse(parsed: MargeVitalsReading) {
  return parsed.displayPulse == null ? '--' : `${Math.round(parsed.displayPulse)} bpm`
}
