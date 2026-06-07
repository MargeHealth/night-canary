import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('sessionId')
  if (!id) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  const session = getSession(id)
  if (!session?.oximetry) return NextResponse.json({ readings: [] })
  return NextResponse.json({ readings: session.oximetry.readings })
}
