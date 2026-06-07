import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm/chat'
import { EXTRACTION_SYSTEM, PATIENT_EXPLAIN_SYSTEM } from '@/lib/llm/prompts'
import { getSession, updateSession } from '@/lib/session'
import { computeOdi } from '@/lib/clinical/odi'
import { computeSpo2Stats } from '@/lib/clinical/spo2-stats'
import { scoreStopBang, type StopBangAnswers } from '@/lib/clinical/stopbang'
import { scoreEpworth } from '@/lib/clinical/epworth'
import { combineRisk } from '@/lib/clinical/risk'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    const session = getSession(sessionId)
    if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 })
    if (!session.oximetry) return NextResponse.json({ error: 'no oximetry uploaded' }, { status: 400 })

    const transcript = session.chat.map(m => `${m.role}: ${m.content}`).join('\n')
    const extractedText = await chat({
      system: EXTRACTION_SYSTEM,
      messages: [{ role: 'user', content: transcript }],
      maxTokens: 800,
    })

    let extracted: {
      stopBang: Partial<Record<keyof StopBangAnswers, boolean | null>>
      epworth: (number | null)[]
      freeText?: string
    }
    try {
      extracted = JSON.parse(extractedText)
    } catch {
      const match = extractedText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Extraction did not return JSON')
      extracted = JSON.parse(match[0])
    }

    // Structured About-You form takes precedence over LLM extraction for BANG + P.
    // Chat-derived extraction is the only source for S, T, O.
    const a = session.aboutYou
    const sbAnswers: StopBangAnswers = {
      snoreLoudly: extracted.stopBang.snoreLoudly ?? false,
      tiredDaytime: extracted.stopBang.tiredDaytime ?? false,
      observedApnea: extracted.stopBang.observedApnea ?? false,
      highBP: a?.highBP ?? extracted.stopBang.highBP ?? false,
      bmiOver35: a?.bmi != null ? a.bmi >= 35 : (extracted.stopBang.bmiOver35 ?? false),
      ageOver50: a?.age != null ? a.age > 50 : (extracted.stopBang.ageOver50 ?? false),
      neckOver40cm: a?.neckCm != null ? a.neckCm > 40 : (extracted.stopBang.neckOver40cm ?? false),
      male: a?.male ?? extracted.stopBang.male ?? false,
    }
    const stopBang = scoreStopBang(sbAnswers)

    const epAnswers: number[] = (extracted.epworth || []).map(v => v ?? 0)
    while (epAnswers.length < 8) epAnswers.push(0)
    const epworth = scoreEpworth(epAnswers.slice(0, 8))

    const odi = computeOdi(session.oximetry.readings)
    const spo2 = computeSpo2Stats(session.oximetry.readings)
    const risk = combineRisk({
      odi: odi.odi,
      stopBangScore: stopBang.score,
      epworthTotal: epworth.total,
      t90: spo2.t90,
      minSpo2: spo2.min,
    })

    const explainPrompt = `ODI: ${odi.odi}/hr (${odi.severity})
Mean SpO2: ${spo2.mean}%
Min SpO2: ${spo2.min}%
T90 (time below 90%): ${spo2.t90}%
STOP-BANG: ${stopBang.score}/8 (${stopBang.risk})
Epworth: ${epworth.total}/24 (${epworth.band})
Overall risk: ${risk.band}
Reasons: ${risk.reasons.join('; ')}`

    const patientExplanation = await chat({
      system: PATIENT_EXPLAIN_SYSTEM,
      messages: [{ role: 'user', content: explainPrompt }],
      maxTokens: 500,
    })

    const scored = { odi, spo2, stopBang, epworth, risk }
    updateSession(sessionId, { scored, patientExplanation })

    return NextResponse.json({ scored, patientExplanation })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'scoring failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
