import type { PulseOxReading } from './types'

export function parseCsv(text: string): PulseOxReading[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) throw new Error('CSV is empty or missing header')

  const header = lines[0].split(',').map(s => s.trim().toLowerCase())
  const tsIdx = header.indexOf('timestamp')
  const spIdx = header.indexOf('spo2')
  const prIdx = header.indexOf('pulse_rate')
  if (tsIdx < 0 || spIdx < 0 || prIdx < 0) {
    throw new Error('CSV missing required columns: timestamp, spo2, pulse_rate')
  }

  const out: PulseOxReading[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    out.push({
      timestamp: Number(cols[tsIdx]),
      spo2: Number(cols[spIdx]),
      pulseRate: Number(cols[prIdx]),
    })
  }
  return out
}
