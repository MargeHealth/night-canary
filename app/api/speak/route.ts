import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/voice/elevenlabs'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text : ''
    if (!text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const audio = await textToSpeech(text)
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'speech failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
