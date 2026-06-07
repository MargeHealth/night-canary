import type { PulseOxReading } from './types'

export function readingsToCsv(readings: PulseOxReading[]): string {
  const lines = ['timestamp,spo2,pulse_rate']
  for (const r of readings) {
    lines.push(`${r.timestamp},${r.spo2.toFixed(1)},${r.pulseRate}`)
  }
  return lines.join('\n')
}

export function downloadCsv(readings: PulseOxReading[], filename = 'pulse-ox-recording.csv') {
  const csv = readingsToCsv(readings)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
