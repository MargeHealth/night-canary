import type { PulseOxReading } from './types'

export const DEFAULT_MARGE_VITALS_WS_URL = 'wss://marge-health-vitals-relay.heysalad-o.workers.dev/websocket'

export type MargeVitalsPayload = {
  bpm?: number | null
  avgBpm?: number | null
  spo2Valid?: boolean
  spo2?: number | null
  spo2Estimate?: number | null
  spo2Status?: 'calibrating' | 'estimate_only' | 'valid' | string
  algorithmHeartRate?: number | null
  sampleProgress?: number | null
  ir?: number | null
  red?: number | null
  validReading?: boolean
  [key: string]: unknown
}

export type MargeVitalsReading = {
  payload: MargeVitalsPayload
  reading: PulseOxReading | null
  displaySpo2: number | null
  displayPulse: number | null
  estimated: boolean
  status: string
}

function plausibleSpo2(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 50 && value <= 100
}

function plausiblePulse(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 20 && value <= 240
}

export function parseMargeVitalsPayload(raw: unknown, timestamp = Date.now()): MargeVitalsReading | null {
  if (!raw || typeof raw !== 'object') return null

  const payload = raw as MargeVitalsPayload
  const validReading = payload.validReading !== false
  const validatedSpo2 = payload.spo2Valid === true && plausibleSpo2(payload.spo2) ? payload.spo2 : null
  const estimatedSpo2 = plausibleSpo2(payload.spo2Estimate) ? payload.spo2Estimate : null
  const displaySpo2 = validatedSpo2 ?? estimatedSpo2
  const pulse = plausiblePulse(payload.avgBpm) ? payload.avgBpm : plausiblePulse(payload.bpm) ? payload.bpm : null
  const status = typeof payload.spo2Status === 'string'
    ? payload.spo2Status
    : validatedSpo2 !== null
      ? 'valid'
      : estimatedSpo2 !== null
        ? 'estimate_only'
        : 'waiting'

  const reading = validReading && displaySpo2 !== null && pulse !== null
    ? {
        timestamp,
        spo2: Math.round(displaySpo2 * 10) / 10,
        pulseRate: Math.round(pulse),
        source: 'marge-relay' as const,
        estimated: validatedSpo2 === null,
      }
    : null

  return {
    payload,
    reading,
    displaySpo2,
    displayPulse: pulse,
    estimated: validatedSpo2 === null && estimatedSpo2 !== null,
    status,
  }
}
