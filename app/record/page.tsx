'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Play, Square, Download, Trash2, Smartphone, ArrowRight, Heart } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { connectPulseOxSerial } from '@/lib/pulseox/serial'
import { computeOdi } from '@/lib/clinical/odi'
import { computeSpo2Stats } from '@/lib/clinical/spo2-stats'
import { downloadCsv } from '@/lib/pulseox/csv-export'
import type { PulseOxReading } from '@/lib/pulseox/types'

const STORAGE_KEY = 'nightcanary.recording.v1'
const PERSIST_INTERVAL_MS = 5000

type StoredRecording = {
  startedAt: number
  endedAt: number | null
  readings: PulseOxReading[]
}

export default function RecordPage() {
  const [supportsSerial] = useState(() => typeof navigator === 'undefined' || 'serial' in navigator)
  const [connected, setConnected] = useState(false)
  const [recording, setRecording] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [readings, setReadings] = useState<PulseOxReading[]>([])
  const [latest, setLatest] = useState<PulseOxReading | null>(null)
  const [error, setError] = useState<string>('')
  const [now, setNow] = useState(0)
  const [resumeAvailable, setResumeAvailable] = useState<StoredRecording | null>(null)

  // Refs so the serial callback always sees latest state
  const recordingRef = useRef(recording)
  const startedAtRef = useRef(startedAt)
  useEffect(() => { recordingRef.current = recording }, [recording])
  useEffect(() => { startedAtRef.current = startedAt }, [startedAt])

  // Detect mobile and check for previous recording on mount
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed: StoredRecording = JSON.parse(stored)
          if (parsed.readings?.length) setResumeAvailable(parsed)
        }
      } catch {}
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  // Tick for the live duration counter
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [recording])

  // Persist current recording to localStorage periodically
  useEffect(() => {
    if (!recording || !startedAt) return
    const id = setInterval(() => {
      try {
        const payload: StoredRecording = { startedAt, endedAt: null, readings }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {}
    }, PERSIST_INTERVAL_MS)
    return () => clearInterval(id)
  }, [recording, startedAt, readings])

  async function connect() {
    setError('')
    try {
      await connectPulseOxSerial(r => {
        setLatest(r)
        if (recordingRef.current && startedAtRef.current !== null) {
          setReadings(prev => [...prev, r])
        }
      })
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'connection failed')
    }
  }

  function startRecording() {
    const started = Date.now()
    setReadings([])
    setStartedAt(started)
    setNow(started)
    setRecording(true)
    setResumeAvailable(null)
  }

  function stopRecording() {
    setRecording(false)
    try {
      const payload: StoredRecording = {
        startedAt: startedAt ?? Date.now(),
        endedAt: Date.now(),
        readings,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }

  function clearRecording() {
    setReadings([])
    setStartedAt(null)
    setRecording(false)
    setResumeAvailable(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  function loadResumed() {
    if (!resumeAvailable) return
    setReadings(resumeAvailable.readings)
    setStartedAt(resumeAvailable.startedAt)
    setResumeAvailable(null)
  }

  function exportCsv() {
    downloadCsv(readings, `nightcanary-${new Date().toISOString().slice(0, 16).replace('T', '_')}.csv`)
  }

  // Derived stats
  const durationMs = startedAt ? (recording ? now : (readings[readings.length - 1]?.timestamp ?? now)) - startedAt : 0
  const odi = readings.length > 60 ? computeOdi(readings) : null
  const spo2Stats = readings.length > 0 ? computeSpo2Stats(readings) : null

  if (!supportsSerial) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Recording requires desktop</h1>
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-slate-400 shrink-0 mt-1" />
              <div>
                <p className="text-slate-700">
                  Web Serial — the browser feature we use to talk to a USB pulse oximeter — only works in
                  <strong> desktop Chrome or Edge</strong>. It is not available on mobile browsers.
                </p>
                <p className="text-sm text-slate-500 mt-3">
                  If you have already recorded a session, you can still upload the CSV from your phone.
                </p>
              </div>
            </div>
            <Link href="/assess">
              <Button className="w-full">
                Go to the assessment instead
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">NightCanary recording</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Record your overnight oxygen
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Plug the pulse oximeter into a USB port, click Connect, pick the COM port, then put the
            device on your finger and start recording before you go to sleep.
          </p>
        </header>

        {/* Resume banner */}
        {resumeAvailable && readings.length === 0 && (
          <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-900">
              We found a previous recording with {resumeAvailable.readings.length} readings.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={loadResumed}>Load it</Button>
              <Button size="sm" variant="ghost" onClick={clearRecording}>Discard</Button>
            </div>
          </Card>
        )}

        {/* Connection card */}
        {!connected && (
          <Card className="p-6 mb-4 text-center">
            <p className="text-slate-700 mb-4">
              {error
                ? <span className="text-red-600">{error}</span>
                : 'Make sure the pulse oximeter is plugged in via USB, then click Connect.'}
            </p>
            <Button onClick={connect} size="lg">
              Connect device
            </Button>
            <p className="text-xs text-slate-500 mt-3">
              The browser will ask you to choose the COM port. Pick the one labelled USB-SERIAL or similar.
            </p>
          </Card>
        )}

        {/* Live readout */}
        {connected && (
          <Card className="p-5 sm:p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <Badge className={recording ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}>
                {recording ? '● RECORDING' : 'Connected'}
              </Badge>
              {startedAt && (
                <span className="text-xs font-mono text-slate-500">
                  {formatDuration(durationMs)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">SpO₂</div>
                <div className="text-5xl sm:text-6xl font-bold text-slate-900 tabular-nums">
                  {latest ? `${Math.round(latest.spo2)}` : '—'}
                  {latest && <span className="text-2xl sm:text-3xl text-slate-400 font-medium ml-1">%</span>}
                </div>
                <div className={`text-xs mt-1 ${latest && latest.spo2 < 90 ? 'text-red-600' : 'text-slate-500'}`}>
                  {latest && latest.spo2 < 90 ? 'Below 90% threshold' : 'Healthy is ≥95%'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Pulse rate
                </div>
                <div className="text-5xl sm:text-6xl font-bold text-slate-900 tabular-nums">
                  {latest ? latest.pulseRate : '—'}
                  {latest && <span className="text-2xl sm:text-3xl text-slate-400 font-medium ml-1">bpm</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1">Resting 60-100 bpm</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              {!recording ? (
                <Button onClick={startRecording} size="lg" className="flex-1">
                  <Play className="w-4 h-4 mr-2" /> Start recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" size="lg" className="flex-1">
                  <Square className="w-4 h-4 mr-2" /> Stop recording
                </Button>
              )}
              {readings.length > 0 && (
                <>
                  <Button onClick={exportCsv} variant="outline" size="lg" className="flex-1 sm:flex-none">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                  <Button onClick={clearRecording} variant="ghost" size="lg" className="sm:flex-none">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Live chart */}
        {connected && readings.length > 0 && (
          <Card className="p-4 sm:p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Live oxygen trace</h2>
            <LiveChart readings={readings} />
          </Card>
        )}

        {/* Running stats */}
        {spo2Stats && readings.length > 5 && (
          <Card className="p-4 sm:p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Session summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Readings" value={readings.length.toString()} />
              <Stat label="Mean SpO₂" value={`${spo2Stats.mean}%`} />
              <Stat label="Min SpO₂" value={`${spo2Stats.min}%`} />
              <Stat label="T90" value={`${spo2Stats.t90}%`} />
              {odi && <Stat label="ODI" value={`${odi.odi}/hr`} hint={odi.severity} />}
              {odi && <Stat label="Desat events" value={odi.events.length.toString()} />}
              <Stat label="Duration" value={formatDuration(durationMs)} />
            </div>
            {odi && readings.length > 60 && (
              <p className="text-xs text-slate-500 mt-4">
                ODI is calculated continuously. For a clinically meaningful overnight result you need at least
                4 hours of sleep recording — short recordings are shown for transparency only.
              </p>
            )}
          </Card>
        )}

        {/* Next-step CTA after stop */}
        {!recording && readings.length > 60 && (
          <Card className="p-5 sm:p-6 mb-4 bg-slate-900 text-white border-slate-900">
            <h3 className="text-lg font-semibold">Ready to get your full assessment?</h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Download the recording as a CSV and upload it on the assessment page, or just take the
              symptom-only assessment first.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={exportCsv} variant="outline" className="bg-white text-slate-900 hover:bg-slate-100">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
              <Link href="/assess">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 w-full sm:w-auto">
                  Go to assessment <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}

function LiveChart({ readings }: { readings: PulseOxReading[] }) {
  // Show last 2 minutes for live feel
  const latestTimestamp = readings[readings.length - 1]?.timestamp ?? 0
  const cutoff = latestTimestamp - 2 * 60 * 1000
  const visible = readings.filter(r => r.timestamp >= cutoff)
  const data = (visible.length > 0 ? visible : readings.slice(-120)).map(r => ({
    t: new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    spo2: r.spo2,
  }))
  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="t" tick={{ fontSize: 9 }} minTickGap={50} />
          <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} width={28} />
          <Tooltip />
          <ReferenceLine y={90} stroke="#dc2626" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="spo2" stroke="#0f766e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-slate-500 capitalize">{hint}</div>}
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}
