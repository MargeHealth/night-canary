import { describe, it, expect } from 'vitest'
import { parseCsv } from '@/lib/pulseox/csv'
import { computeOdi } from '@/lib/clinical/odi'
import { computeSpo2Stats } from '@/lib/clinical/spo2-stats'
import { scoreStopBang, type StopBangAnswers } from '@/lib/clinical/stopbang'
import { scoreEpworth } from '@/lib/clinical/epworth'
import { combineRisk } from '@/lib/clinical/risk'
import { parseMargeVitalsPayload } from '@/lib/pulseox/marge-relay'
import type { PulseOxReading } from '@/lib/pulseox/types'

function readings(values: number[]): PulseOxReading[] {
  return values.map((spo2, i) => ({ timestamp: i * 4000, spo2, pulseRate: 60 }))
}

describe('parseCsv', () => {
  it('parses well-formed CSV with header', () => {
    const csv = 'timestamp,spo2,pulse_rate\n1700000000000,96.5,62\n1700000004000,96.3,63'
    const r = parseCsv(csv)
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({ timestamp: 1700000000000, spo2: 96.5, pulseRate: 62 })
  })

  it('throws on missing required columns', () => {
    expect(() => parseCsv('time,spo2\n1,97')).toThrow(/required columns/)
  })
})

describe('parseMargeVitalsPayload', () => {
  it('uses validated SpO2 when the firmware marks it valid', () => {
    const parsed = parseMargeVitalsPayload({
      bpm: 72.2,
      avgBpm: 70,
      spo2Valid: true,
      spo2: 96.3,
      spo2Estimate: 92.4,
      spo2Status: 'valid',
      validReading: true,
    }, 1700000000000)

    expect(parsed?.displaySpo2).toBe(96.3)
    expect(parsed?.estimated).toBe(false)
    expect(parsed?.reading).toEqual({
      timestamp: 1700000000000,
      spo2: 96.3,
      pulseRate: 70,
      source: 'marge-relay',
      estimated: false,
    })
  })

  it('uses the estimate while the MAX30105 is calibrating instead of treating null as zero', () => {
    const parsed = parseMargeVitalsPayload({
      bpm: 47.2,
      avgBpm: 66,
      spo2Valid: false,
      spo2: null,
      spo2Estimate: 92.4,
      spo2Status: 'calibrating',
      sampleProgress: 42,
      validReading: true,
    }, 1700000004000)

    expect(parsed?.displaySpo2).toBe(92.4)
    expect(parsed?.status).toBe('calibrating')
    expect(parsed?.reading).toMatchObject({
      timestamp: 1700000004000,
      spo2: 92.4,
      pulseRate: 66,
      source: 'marge-relay',
      estimated: true,
    })
  })

  it('does not create a reading when the sensor reports no valid finger signal', () => {
    const parsed = parseMargeVitalsPayload({
      bpm: 0,
      spo2Valid: false,
      spo2: null,
      spo2Estimate: null,
      validReading: false,
    })

    expect(parsed?.reading).toBeNull()
  })
})

describe('computeOdi', () => {
  it('returns 0 for a flat trace', () => {
    const result = computeOdi(readings(Array(900).fill(97)))
    expect(result.odi).toBe(0)
    expect(result.severity).toBe('normal')
  })

  it('classifies severity bands', () => {
    expect(computeOdi(readings(Array(900).fill(97))).severity).toBe('normal')
  })
})

describe('computeSpo2Stats', () => {
  it('computes mean, min, max', () => {
    const stats = computeSpo2Stats(readings([95, 96, 97, 98]))
    expect(stats.mean).toBe(96.5)
    expect(stats.min).toBe(95)
    expect(stats.max).toBe(98)
  })

  it('reports T90 as percentage', () => {
    const trace = [...Array(75).fill(95), ...Array(25).fill(85)]
    const stats = computeSpo2Stats(readings(trace))
    expect(stats.t90).toBe(25)
  })
})

describe('scoreStopBang', () => {
  const allNo: StopBangAnswers = {
    snoreLoudly: false, tiredDaytime: false, observedApnea: false,
    highBP: false, bmiOver35: false, ageOver50: false,
    neckOver40cm: false, male: false,
  }

  it('scores 0 for all no', () => {
    const r = scoreStopBang(allNo)
    expect(r.score).toBe(0)
    expect(r.risk).toBe('low')
  })

  it('scores 8 for all yes (high risk)', () => {
    const yes = Object.fromEntries(Object.keys(allNo).map(k => [k, true])) as StopBangAnswers
    const r = scoreStopBang(yes)
    expect(r.score).toBe(8)
    expect(r.risk).toBe('high')
  })

  it('intermediate band 3-4', () => {
    const r = scoreStopBang({ ...allNo, snoreLoudly: true, tiredDaytime: true, observedApnea: true })
    expect(r.score).toBe(3)
    expect(r.risk).toBe('intermediate')
  })
})

describe('scoreEpworth', () => {
  it('scores 0 for no chance of dozing', () => {
    const r = scoreEpworth(Array(8).fill(0))
    expect(r.total).toBe(0)
    expect(r.band).toBe('normal')
  })

  it('flags moderate band on total 13', () => {
    const r = scoreEpworth([2, 2, 1, 2, 2, 1, 2, 1])
    expect(r.total).toBe(13)
    expect(r.band).toBe('moderate')
  })

  it('throws on wrong answer count', () => {
    expect(() => scoreEpworth([0, 1])).toThrow()
  })
})

describe('combineRisk', () => {
  it('returns low when all indicators are negative', () => {
    const r = combineRisk({ odi: 2, stopBangScore: 1, epworthTotal: 4, t90: 0.5, minSpo2: 94 })
    expect(r.band).toBe('low')
  })

  it('returns high when ODI is severe (>= 30) alone', () => {
    const r = combineRisk({ odi: 32, stopBangScore: 0, epworthTotal: 0 })
    expect(r.band).toBe('high')
  })

  it('returns high when min SpO2 < 85% regardless of other indicators', () => {
    const r = combineRisk({ odi: 4, stopBangScore: 1, epworthTotal: 5, minSpo2: 78 })
    expect(r.band).toBe('high')
  })

  it('returns high when ODI moderate AND STOP-BANG >= 3', () => {
    const r = combineRisk({ odi: 22, stopBangScore: 4, epworthTotal: 6 })
    expect(r.band).toBe('high')
  })

  it('returns moderate when ODI is mildly elevated alone', () => {
    const r = combineRisk({ odi: 7, stopBangScore: 1, epworthTotal: 4 })
    expect(r.band).toBe('moderate')
  })

  it('returns moderate when T90 is elevated even with low ODI', () => {
    const r = combineRisk({ odi: 3, stopBangScore: 1, epworthTotal: 4, t90: 6, minSpo2: 88 })
    expect(r.band).toBe('moderate')
  })
})
