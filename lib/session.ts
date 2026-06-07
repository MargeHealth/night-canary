import type { ChatMessage } from './llm/anthropic'
import type { OvernightSession } from './pulseox/types'
import type { OdiResult } from './clinical/odi'
import type { Spo2Stats } from './clinical/spo2-stats'
import type { StopBangResult } from './clinical/stopbang'
import type { EpworthResult } from './clinical/epworth'
import type { CombinedRiskResult } from './clinical/risk'

export type AboutYou = {
  age?: number
  male?: boolean
  bmi?: number
  neckCm?: number
  highBP?: boolean
}

export type Session = {
  id: string
  chat: ChatMessage[]
  covered: string[]   // cumulative STOP-BANG + Epworth codes confidently answered
  aboutYou?: AboutYou
  oximetry?: OvernightSession
  scored?: {
    odi: OdiResult
    spo2: Spo2Stats
    stopBang: StopBangResult
    epworth: EpworthResult
    risk: CombinedRiskResult
  }
  patientExplanation?: string
  gpLetter?: string
}

// Survive hot-reload in dev and warm-instance reuse on Vercel:
// stash the Map on globalThis so module reloads don't wipe state.
const globalRef = globalThis as typeof globalThis & {
  __osaSessionStore?: Map<string, Session>
}
const store: Map<string, Session> =
  globalRef.__osaSessionStore ?? (globalRef.__osaSessionStore = new Map())

export function createSession(): Session {
  const id = crypto.randomUUID()
  const session: Session = { id, chat: [], covered: [] }
  store.set(id, session)
  return session
}

export function getSession(id: string): Session | undefined {
  return store.get(id)
}

export function updateSession(id: string, patch: Partial<Session>): Session {
  const existing = store.get(id)
  if (!existing) throw new Error(`Session ${id} not found`)
  const next = { ...existing, ...patch }
  store.set(id, next)
  return next
}
