import type { PulseOxReading } from '@/lib/pulseox/types'

export type OdiSeverity = 'normal' | 'mild' | 'moderate' | 'severe'

export type DesaturationEvent = {
  startTimestamp: number
  nadirTimestamp: number
  baseline: number
  nadir: number
  drop: number
}

export type OdiResult = {
  odi: number
  events: DesaturationEvent[]
  recordingHours: number
  severity: OdiSeverity
}

export function computeOdi(
  readings: PulseOxReading[],
  opts: { threshold?: number; baselineWindowSec?: number; minDurationSec?: number } = {}
): OdiResult {
  const threshold = opts.threshold ?? 3
  const baselineWindowSec = opts.baselineWindowSec ?? 120
  const minDurationSec = opts.minDurationSec ?? 10

  if (readings.length < 2) {
    return { odi: 0, events: [], recordingHours: 0, severity: 'normal' }
  }

  const samplePeriodMs = readings[1].timestamp - readings[0].timestamp
  const baselineSamples = Math.max(1, Math.round((baselineWindowSec * 1000) / samplePeriodMs))
  const minDurationSamples = Math.max(1, Math.round((minDurationSec * 1000) / samplePeriodMs))

  const events: DesaturationEvent[] = []
  let i = 0
  while (i < readings.length) {
    const baseline = recentBaseline(readings, i, baselineSamples)
    if (readings[i].spo2 <= baseline - threshold) {
      let nadirIdx = i
      let j = i
      while (j < readings.length && readings[j].spo2 < baseline - 1) {
        if (readings[j].spo2 < readings[nadirIdx].spo2) nadirIdx = j
        j++
      }
      const duration = j - i
      if (duration >= minDurationSamples) {
        events.push({
          startTimestamp: readings[i].timestamp,
          nadirTimestamp: readings[nadirIdx].timestamp,
          baseline,
          nadir: readings[nadirIdx].spo2,
          drop: baseline - readings[nadirIdx].spo2,
        })
      }
      i = j + 1
    } else {
      i++
    }
  }

  const durationMs = readings[readings.length - 1].timestamp - readings[0].timestamp
  const recordingHours = durationMs / 3_600_000
  const odi = recordingHours > 0 ? events.length / recordingHours : 0

  return {
    odi: Math.round(odi * 10) / 10,
    events,
    recordingHours: Math.round(recordingHours * 10) / 10,
    severity: classify(odi),
  }
}

function recentBaseline(readings: PulseOxReading[], idx: number, windowSamples: number): number {
  const start = Math.max(0, idx - windowSamples)
  let max = 0
  for (let k = start; k < idx; k++) {
    if (readings[k].spo2 > max) max = readings[k].spo2
  }
  return max || readings[idx].spo2
}

function classify(odi: number): OdiSeverity {
  if (odi < 5) return 'normal'
  if (odi < 15) return 'mild'
  if (odi < 30) return 'moderate'
  return 'severe'
}
