import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('sessionId')
  if (!id) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  const session = getSession(id)
  if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 })

  return NextResponse.json({
    id: session.id,
    chatMessageCount: session.chat.length,
    chat: session.chat,
    hasOximetry: !!session.oximetry,
    oximetryReadingCount: session.oximetry?.readings.length ?? 0,
    scored: session.scored,
    patientExplanation: session.patientExplanation,
    gpLetter: session.gpLetter,
  })
}
