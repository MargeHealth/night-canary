export type PulseOxReading = {
  timestamp: number  // unix millis
  spo2: number       // percent, 0-100
  pulseRate: number  // beats per minute
  source?: 'csv' | 'sample' | 'web-serial' | 'marge-relay'
  estimated?: boolean
}

export type OvernightSession = {
  startedAt: number
  endedAt: number
  readings: PulseOxReading[]
}
