import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm/chat'
import { INTAKE_SYSTEM } from '@/lib/llm/prompts'
import { createSession, getSession, updateSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userMessage: string = body.message
    const sessionId: string | undefined = body.sessionId

    let session = sessionId ? getSession(sessionId) : undefined
    if (!session) session = createSession()

    const nextChat = [...session.chat, { role: 'user' as const, content: userMessage }]

    // Count meaningful user messages (excluding the synthetic bootstrap prompt)
    const userTurns = nextChat.filter(
      m => m.role === 'user' && !m.content.startsWith('Please ask me your first follow-up')
    ).length

    // Pre-seed COVERED from the structured About-You form so Claude doesn't re-ask.
    const aboutCodes: string[] = []
    const a = session.aboutYou
    if (a) {
      if (a.age != null) aboutCodes.push('A')
      if (a.male != null) aboutCodes.push('G')
      if (a.bmi != null) aboutCodes.push('B')
      if (a.neckCm != null) aboutCodes.push('N')
      if (a.highBP != null) aboutCodes.push('P')
    }

    const MAX_USER_TURNS = 5  // STO + 2-3 Epworth; keep the demo path short
    const turnsRemaining = Math.max(0, MAX_USER_TURNS - userTurns)

    // Build a focused system prompt: skip what the form covered, focus on STO + Epworth.
    const formContext = a
      ? `\n\nThe user has ALREADY filled in a structured form. Do NOT ask about these — they are known:
${a.age != null ? `- Age: ${a.age}` : ''}
${a.male != null ? `- Sex: ${a.male ? 'male' : 'female'}` : ''}
${a.bmi != null ? `- BMI: ${a.bmi}` : ''}
${a.neckCm != null ? `- Neck circumference: ${a.neckCm} cm` : ''}
${a.highBP != null ? `- High blood pressure: ${a.highBP ? 'yes' : 'no'}` : ''}

These items (A, G, B, N, P) are already in [COVERED:] — keep them there. Focus your questions on:
- S: snoring loudly
- T: daytime tiredness
- O: observed pauses in breathing
- Epworth Sleepiness Scale items (E1-E8)`
      : ''

    const systemWithBudget = `${INTAKE_SYSTEM}${formContext}\n\nQuestions remaining in this session: ${turnsRemaining}. If this is your last question, wrap up briefly and append <DONE> on its own line at the end of your response.`

    const assistantText = await chat({
      system: systemWithBudget,
      messages: nextChat,
      maxTokens: 400,
    })

    const modelSaidDone = assistantText.includes('<DONE>')
    const cappedDone = userTurns >= MAX_USER_TURNS
    const done = modelSaidDone || cappedDone

    // Parse the [COVERED: ...] tag from the model output, validate against known codes
    const VALID_CODES = new Set([
      'S', 'T', 'O', 'P', 'B', 'A', 'N', 'G',
      'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8',
    ])
    const coveredMatch = assistantText.match(/\[COVERED:\s*([^\]]*)\]/i)
    const newCodes: string[] = coveredMatch
      ? coveredMatch[1].split(',').map(s => s.trim().toUpperCase()).filter(c => VALID_CODES.has(c))
      : []

    // Cumulative: union with previously-covered codes AND any codes derived from
    // the structured About-You form. Even if the model regresses, we never un-tick.
    const coveredSet = new Set([...(session.covered ?? []), ...aboutCodes, ...newCodes])
    const covered = Array.from(coveredSet)

    const cleaned = assistantText
      .replace(/<DONE>/g, '')
      .replace(/\[COVERED:[^\]]*\]/gi, '')
      .trim()

    const updatedChat = [...nextChat, { role: 'assistant' as const, content: cleaned }]
    updateSession(session.id, { chat: updatedChat, covered })

    return NextResponse.json({ sessionId: session.id, reply: cleaned, done, covered })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
