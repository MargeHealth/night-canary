import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm/chat'
import { LETTER_SYSTEM } from '@/lib/llm/prompts'
import { getSession, updateSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    const session = getSession(sessionId)
    if (!session || !session.scored) {
      return NextResponse.json({ error: 'session must be scored first' }, { status: 400 })
    }

    const transcript = session.chat.map(m => `${m.role}: ${m.content}`).join('\n')
    const s = session.scored

    const userMessage = `Conversation transcript:
${transcript}

Clinical scores:
- ODI: ${s.odi.odi}/hr (${s.odi.severity}) over ${s.odi.recordingHours} hours of recording
- Mean SpO2: ${s.spo2.mean}%; Min SpO2: ${s.spo2.min}%; T90: ${s.spo2.t90}%
- STOP-BANG: ${s.stopBang.score}/8 (${s.stopBang.risk}); positive items: ${s.stopBang.positiveItems.join(', ') || 'none'}
- Epworth Sleepiness Scale: ${s.epworth.total}/24 (${s.epworth.band})
- Overall risk band: ${s.risk.band}
- Reasoning: ${s.risk.reasons.join('; ')}

Write the GP referral preparation letter.`

    const letter = await chat({
      system: LETTER_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 1200,
    })

    updateSession(sessionId, { gpLetter: letter })
    return NextResponse.json({ letter })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'letter generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
