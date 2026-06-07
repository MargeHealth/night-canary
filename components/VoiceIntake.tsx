'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Keyboard, ArrowRight } from 'lucide-react'
import type { WizardCtx } from './Wizard'

type Status = 'idle' | 'recording' | 'transcribing'

export function VoiceIntake({ ctx }: { ctx: WizardCtx }) {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setStatus('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          // Append to existing transcript so multiple recordings can stack
          setTranscript(prev => (prev ? prev.trim() + ' ' : '') + (data.text ?? ''))
        } catch (err) {
          setError(err instanceof Error ? err.message : 'transcription failed')
        } finally {
          setStatus('idle')
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setStatus('recording')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'microphone access denied')
      setStatus('idle')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  async function sendToChat() {
    if (!transcript.trim() || sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.sessionId) ctx.setSessionId(data.sessionId)
      ctx.next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to start')
      setSending(false)
    }
  }

  const isRecording = status === 'recording'
  const isTranscribing = status === 'transcribing'
  const canContinue = transcript.trim().length > 0 && !sending && !isRecording && !isTranscribing

  return (
    <Card className="p-5 sm:p-8">
      <p className="text-sm sm:text-base text-slate-700 mb-1">
        Tell us in your own words what you have been feeling.
      </p>
      <p className="text-xs text-slate-500 mb-6">
        Daytime tiredness, sleep, snoring, headaches, anything your partner has noticed.
      </p>

      {/* Microphone area */}
      <div className="flex flex-col items-center py-6 sm:py-8">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`
            relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center
            transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
            ${isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:shadow-lg'}
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {/* Pulsing ring while recording */}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-red-500/30 animate-ping" style={{ animationDelay: '0.4s' }} />
            </>
          )}
          {isRecording ? <Square className="w-8 h-8 sm:w-10 sm:h-10 relative" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />}
        </button>

        <div className="mt-4 h-5 text-sm">
          {status === 'idle' && !transcript && (
            <span className="text-slate-500">Tap to start recording</span>
          )}
          {status === 'idle' && transcript && (
            <span className="text-slate-500">Tap the mic to add more</span>
          )}
          {isRecording && (
            <span className="flex items-center gap-2 text-red-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Recording — tap again to stop
            </span>
          )}
          {isTranscribing && (
            <span className="text-slate-500 italic">Transcribing…</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-slate-200" />
        <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider">
          <Keyboard className="w-3.5 h-3.5" />
          Or type
        </div>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Transcript / type area */}
      <textarea
        ref={textareaRef}
        rows={5}
        placeholder="Describe how you've been feeling…"
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        className="w-full p-3 border border-slate-300 rounded-md text-slate-900 bg-white placeholder:text-slate-400 text-sm leading-relaxed resize-y mt-4 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
      />

      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>{transcript.length} characters</span>
        {transcript.length > 0 && (
          <button
            onClick={() => setTranscript('')}
            className="text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={sendToChat}
        disabled={!canContinue}
        size="lg"
        className="w-full mt-6"
      >
        {sending ? 'Starting…' : (
          <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </Button>
    </Card>
  )
}
