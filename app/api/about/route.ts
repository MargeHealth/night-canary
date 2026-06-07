import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSession, updateSession, type AboutYou } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let session = body.sessionId ? getSession(body.sessionId) : undefined
    if (!session) session = createSession()

    const aboutYou: AboutYou = {
      age: body.age != null ? Number(body.age) : undefined,
      male: typeof body.male === 'boolean' ? body.male : undefined,
      bmi: body.bmi != null ? Number(body.bmi) : undefined,
      neckCm: body.neckCm != null ? Number(body.neckCm) : undefined,
      highBP: typeof body.highBP === 'boolean' ? body.highBP : undefined,
    }

    updateSession(session.id, { aboutYou })
    return NextResponse.json({ sessionId: session.id, aboutYou })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to save'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
