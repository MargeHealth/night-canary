'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CoverageChecklist } from './CoverageChecklist'
import type { WizardCtx } from './Wizard'

type Msg = { role: 'user' | 'assistant'; content: string }

export function ChatFollowups({ ctx }: { ctx: WizardCtx }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [covered, setCovered] = useState<string[]>([])
  const inited = useRef(false)
  const sessionId = ctx.sessionId

  const sendInitial = useCallback(async () => {
    if (!sessionId) return
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: 'Please ask me your first follow-up question.' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsgs([{ role: 'assistant', content: data.reply }])
      if (Array.isArray(data.covered)) setCovered(data.covered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'chat failed')
    } finally {
      setBusy(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (inited.current || !sessionId) return
    inited.current = true
    void sendInitial()
  }, [sessionId, sendInitial])

  async function send() {
    if (!input.trim() || busy) return
    const userMsg = input
    setInput('')
    setMsgs(m => [...m, { role: 'user', content: userMsg }])
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: ctx.sessionId, message: userMsg }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsgs(m => [...m, { role: 'assistant', content: data.reply }])
      if (Array.isArray(data.covered)) setCovered(data.covered)
      if (data.done) setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'chat failed')
    } finally {
      setBusy(false)
    }
  }

  async function useDemoAnswers() {
    if (busy) return
    const demoMsg = 'Yes, my partner has seen me stop breathing at night. I have a high chance of dozing while reading, watching TV, as a passenger in a car for an hour, and lying down in the afternoon. I sometimes doze after lunch, but I usually stay awake when talking to someone.'
    setError(null)
    setMsgs(m => [...m, { role: 'user', content: demoMsg }])
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: ctx.sessionId, message: demoMsg }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (Array.isArray(data.covered)) setCovered(data.covered)
      ctx.next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'chat failed')
    } finally {
      setBusy(false)
    }
  }

  const hasAnsweredFollowup = msgs.some(m => m.role === 'user')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <Card className="p-6 space-y-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`p-3 rounded ${m.role === 'assistant' ? 'bg-slate-100' : 'bg-blue-50 ml-12'}`}>
              <p className="text-slate-800 whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {busy && <p className="text-sm text-slate-500">Thinking...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        {!done && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 border border-slate-300 rounded bg-white text-slate-900 placeholder:text-slate-400"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type your answer..."
                disabled={busy}
              />
              <Button onClick={send} disabled={busy || !input.trim()}>Send</Button>
            </div>
            {msgs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={useDemoAnswers} disabled={busy} variant="secondary" className="w-full">
                  Use demo answers
                </Button>
                <Button onClick={ctx.next} disabled={busy || !hasAnsweredFollowup} variant="outline" className="w-full">
                  Continue to sleep data
                </Button>
              </div>
            )}
          </div>
        )}
        {done && (
          <Button onClick={ctx.next} className="w-full">Continue to sleep data</Button>
        )}
      </Card>

      <div className="hidden lg:block">
        <CoverageChecklist covered={covered} />
      </div>

      {/* Mobile collapsible checklist */}
      <details className="lg:hidden">
        <summary className="cursor-pointer text-xs text-slate-600 font-medium px-2 py-1 select-none">
          Show clinical coverage checklist ({covered.length} items covered)
        </summary>
        <div className="mt-2">
          <CoverageChecklist covered={covered} />
        </div>
      </details>
    </div>
  )
}
