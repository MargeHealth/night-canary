import type { OvernightSession } from './types'
import { parseCsv } from './csv'

export async function loadSample(name: 'normal' | 'moderate-osa'): Promise<OvernightSession> {
  const file = name === 'normal' ? 'normal-night.csv' : 'moderate-osa-night.csv'
  const res = await fetch(`/samples/${file}`)
  if (!res.ok) throw new Error(`Failed to load sample: ${file}`)
  const text = await res.text()
  const readings = parseCsv(text)
  return {
    startedAt: readings[0].timestamp,
    endedAt: readings[readings.length - 1].timestamp,
    readings,
  }
}
