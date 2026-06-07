'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CoverageChecklist } from './CoverageChecklist'
import { ReadAloudButton } from './ReadAloudButton'
import { Loader2, Mic, Square } from 'lucide-react'
import type { WizardCtx } from './Wizard'

type Msg = { role: 'user' | 'assistant'; content: string }
type VoiceStatus = 'idle' | 'recording' | 'transcribing'

export function ChatFollowups({ ctx }: { ctx: WizardCtx }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [covered, setCovered] = useState<string[]>([])
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const inited = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
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

  async function sendMessage(userMsg: string, opts?: { advanceAfter?: boolean }) {
    const trimmed = userMsg.trim()
    if (!trimmed || busy) return
    setError(null)
    if (!opts?.advanceAfter) setInput('')
    setMsgs(m => [...m, { role: 'user', content: trimmed }])
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: ctx.sessionId, message: trimmed }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!opts?.advanceAfter) {
        setMsgs(m => [...m, { role: 'assistant', content: data.reply }])
      }
      if (Array.isArray(data.covered)) setCovered(data.covered)
      if (data.done) setDone(true)
      if (opts?.advanceAfter) ctx.next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'chat failed')
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    await sendMessage(input)
  }

  async function startVoiceAnswer() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setVoiceStatus('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'answer.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          const text = typeof data.text === 'string' ? data.text.trim() : ''
          if (!text) throw new Error('No speech detected. Try again or type your answer.')
          await sendMessage(text)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'voice answer failed')
        } finally {
          setVoiceStatus('idle')
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setVoiceStatus('recording')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'microphone access denied')
      setVoiceStatus('idle')
    }
  }

  function stopVoiceAnswer() {
    recorderRef.current?.stop()
  }

  async function useDemoAnswers() {
    if (busy) return
    const demoMsg = 'Yes, my partner has seen me stop breathing at night. I have a high chance of dozing while reading, watching TV, as a passenger in a car for an hour, and lying down in the afternoon. I sometimes doze after lunch, but I usually stay awake when talking to someone.'
    await sendMessage(demoMsg, { advanceAfter: true })
  }

  const hasAnsweredFollowup = msgs.some(m => m.role === 'user')
  const isRecording = voiceStatus === 'recording'
  const isTranscribing = voiceStatus === 'transcribing'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <Card className="p-6 space-y-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`p-3 rounded ${m.role === 'assistant' ? 'bg-slate-100' : 'bg-blue-50 ml-12'}`}>
              <p className="text-slate-800 whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && (
                <ReadAloudButton
                  text={m.content}
                  label="Listen"
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-24"
                />
              )}
            </div>
          ))}
          {busy && <p className="text-sm text-slate-500">Thinking...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        {!done && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={isRecording ? stopVoiceAnswer : startVoiceAnswer}
                disabled={busy || isTranscribing}
                variant={isRecording ? 'destructive' : 'outline'}
                aria-label={isRecording ? 'Stop voice answer' : 'Speak answer'}
                className="w-12 px-0 shrink-0"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <input
                className="flex-1 p-3 border border-slate-300 rounded bg-white text-slate-900 placeholder:text-slate-400"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={isRecording ? 'Listening...' : isTranscribing ? 'Transcribing...' : 'Speak or type your answer...'}
                disabled={busy || isTranscribing}
              />
              <Button onClick={send} disabled={busy || isRecording || !input.trim()}>Send</Button>
            </div>
            {isRecording && (
              <p className="text-xs text-red-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Recording your answer. Tap the square to send it.
              </p>
            )}
            {isTranscribing && <p className="text-xs text-slate-500">Transcribing your answer and updating the checklist...</p>}
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
