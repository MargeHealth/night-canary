import { NextRequest, NextResponse } from 'next/server'
import { transcribe } from '@/lib/llm/openai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'audio blob required' }, { status: 400 })
    }
    const text = await transcribe(audio)
    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
