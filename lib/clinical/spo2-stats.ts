import type { PulseOxReading } from '@/lib/pulseox/types'

export type Spo2Stats = {
  mean: number
  min: number
  max: number
  t90: number
}

export function computeSpo2Stats(readings: PulseOxReading[]): Spo2Stats {
  if (readings.length === 0) {
    return { mean: 0, min: 0, max: 0, t90: 0 }
  }
  let sum = 0
  let min = Infinity
  let max = -Infinity
  let below90 = 0
  for (const r of readings) {
    sum += r.spo2
    if (r.spo2 < min) min = r.spo2
    if (r.spo2 > max) max = r.spo2
    if (r.spo2 < 90) below90++
  }
  return {
    mean: Math.round((sum / readings.length) * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    t90: Math.round((below90 / readings.length) * 1000) / 10,
  }
}
