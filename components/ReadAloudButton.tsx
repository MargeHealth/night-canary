'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ReadAloudButtonProps = {
  text: string
  label?: string
  className?: string
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

function speechText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3800)
}

export function ReadAloudButton({
  text,
  label = 'Read aloud',
  className,
  variant = 'outline',
  size = 'default',
}: ReadAloudButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => stopPlayback()
  }, [])

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    window.speechSynthesis?.cancel()
    setPlaying(false)
  }

  function playBrowserFallback(content: string) {
    if (!('speechSynthesis' in window)) {
      throw new Error('Voice playback is unavailable in this browser.')
    }
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = 'en-GB'
    utterance.rate = 0.95
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setNotice('Using browser voice fallback until ElevenLabs is configured.')
    setPlaying(true)
  }

  async function readAloud() {
    if (playing) {
      stopPlayback()
      return
    }

    const content = speechText(text)
    if (!content || loading) return

    setLoading(true)
    setNotice(null)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(typeof data.error === 'string' ? data.error : 'ElevenLabs voice is unavailable.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      urlRef.current = url
      audio.onended = stopPlayback
      audio.onerror = () => {
        stopPlayback()
        setNotice('Audio playback failed.')
      }
      await audio.play()
      setPlaying(true)
    } catch {
      try {
        playBrowserFallback(content)
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Voice playback failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={readAloud}
        disabled={loading || !speechText(text)}
        variant={variant}
        size={size}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : playing ? (
          <Square className="w-4 h-4 mr-2" />
        ) : (
          <Volume2 className="w-4 h-4 mr-2" />
        )}
        {playing ? 'Stop' : label}
      </Button>
      {notice && <p className="mt-1 text-[11px] leading-snug text-slate-500">{notice}</p>}
    </div>
  )
}
