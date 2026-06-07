'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { connectPulseOxSerial } from '@/lib/pulseox/serial'
import type { PulseOxReading } from '@/lib/pulseox/types'

export default function TestSerialPage() {
  const [readings, setReadings] = useState<PulseOxReading[]>([])
  const [error, setError] = useState<string>('')
  const [connected, setConnected] = useState(false)

  async function connect() {
    setError('')
    try {
      await connectPulseOxSerial(r => setReadings(prev => [...prev, r].slice(-50)))
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'connection failed')
    }
  }

  const latest = readings[readings.length - 1]

  return (
    <main className="max-w-2xl mx-auto p-6 font-mono text-sm">
      <h1 className="text-2xl font-semibold mb-4">Pulse-ox serial debug</h1>
      <p className="text-slate-600 text-xs mb-4">
        Open in Chrome or Edge on desktop. Plug in the pulse oximeter, click Connect, and pick the COM port.
        Defaults assume Contec CMS50-family protocol at 9600 baud.
      </p>
      <Button onClick={connect} disabled={connected}>
        {connected ? 'Connected' : 'Connect via USB'}
      </Button>
      {error && <pre className="text-red-600 mt-3 text-xs">{error}</pre>}
      {latest && (
        <div className="mt-6 p-4 bg-slate-100 rounded">
          <div className="text-3xl font-bold text-slate-900">{latest.spo2}%</div>
          <div className="text-slate-600">{latest.pulseRate} bpm</div>
        </div>
      )}
      {readings.length > 0 && (
        <pre className="mt-4 p-3 bg-slate-50 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(readings.slice(-10), null, 2)}
        </pre>
      )}
    </main>
  )
}
