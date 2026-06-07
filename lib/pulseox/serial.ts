import type { PulseOxReading } from './types'
import {
  parseMargeVitalsPayload,
  type MargeVitalsReading,
} from './marge-relay'

export type SerialLike = {
  readable: ReadableStream<Uint8Array> | null
  open: (opts: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
}

type SerialNavigator = Navigator & {
  serial: {
    requestPort: () => Promise<SerialLike>
  }
}

export async function connectPulseOxSerial(
  onReading: (r: PulseOxReading) => void,
  parser: (buf: number[]) => PulseOxReading | null = tryParseCms50Packet,
): Promise<SerialLike> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial not supported — use Chrome or Edge on desktop')
  }
  const port = await (navigator as SerialNavigator).serial.requestPort()
  await port.open({ baudRate: 9600 })

  const buf: number[] = []

  void (async () => {
    if (!port.readable) return
    const reader = port.readable.getReader()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue
        for (const b of value) buf.push(b)
        let reading: PulseOxReading | null
        while ((reading = parser(buf))) {
          onReading(reading)
        }
      }
    } finally {
      reader.releaseLock()
    }
  })()

  return port
}

export async function connectMargeVitalsSerial(
  onPacket: (packet: MargeVitalsReading) => void,
  onLog?: (line: string) => void,
): Promise<SerialLike> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial not supported — use Chrome or Edge on desktop')
  }

  const port = await (navigator as SerialNavigator).serial.requestPort()
  await port.open({ baudRate: 115200 })

  const decoder = new TextDecoder()
  let textBuffer = ''

  void (async () => {
    if (!port.readable) return
    const reader = port.readable.getReader()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue

        textBuffer += decoder.decode(value, { stream: true })
        const lines = textBuffer.split(/\r?\n/)
        textBuffer = lines.pop() ?? ''

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line) continue
          onLog?.(line)

          const jsonText = extractJsonObject(line)
          if (!jsonText) continue

          try {
            const parsed = parseMargeVitalsPayload(JSON.parse(jsonText))
            if (parsed) onPacket(parsed)
          } catch {
            // Ignore non-JSON debug lines from the firmware.
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  })()

  return port
}

function extractJsonObject(line: string): string | null {
  const sentPrefix = 'Sent:'
  const jsonStart = line.startsWith(sentPrefix)
    ? line.indexOf('{', sentPrefix.length)
    : line.indexOf('{')

  if (jsonStart < 0) return null

  const jsonEnd = line.lastIndexOf('}')
  if (jsonEnd <= jsonStart) return null

  return line.slice(jsonStart, jsonEnd + 1)
}

/**
 * Contec CMS50D+/E/F protocol parser.
 * 5-byte packets; byte 0 has sync bit 0x80; SpO2 is byte 3 & 0x7F; pulse rate is byte 2 & 0x7F.
 * Reference: github.com/zh2x/CMS50D_protocol
 */
export function tryParseCms50Packet(buf: number[]): PulseOxReading | null {
  while (buf.length > 0 && (buf[0] & 0x80) === 0) buf.shift()
  if (buf.length < 5) return null
  const packet = buf.splice(0, 5)
  const pulseRate = packet[2] & 0x7F
  const spo2 = packet[3] & 0x7F
  if (spo2 === 127 || pulseRate === 127) return null
  if (spo2 < 50 || spo2 > 100) return null
  return { timestamp: Date.now(), spo2, pulseRate }
}
