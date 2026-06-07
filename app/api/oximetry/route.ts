import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession, createSession } from '@/lib/session'
import { parseCsv } from '@/lib/pulseox/csv'
import type { OvernightSession } from '@/lib/pulseox/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let session = body.sessionId ? getSession(body.sessionId) : undefined
    if (!session) session = createSession()

    let oximetry: OvernightSession
    if (body.csv) {
      const readings = parseCsv(body.csv)
      oximetry = {
        startedAt: readings[0].timestamp,
        endedAt: readings[readings.length - 1].timestamp,
        readings,
      }
    } else if (body.oximetry) {
      oximetry = body.oximetry
    } else {
      return NextResponse.json({ error: 'csv or oximetry payload required' }, { status: 400 })
    }

    updateSession(session.id, { oximetry })
    return NextResponse.json({ sessionId: session.id, readingCount: oximetry.readings.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
