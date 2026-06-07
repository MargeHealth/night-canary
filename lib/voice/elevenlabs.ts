const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
const DEFAULT_MODEL = 'eleven_multilingual_v2'

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey || apiKey.startsWith('REPLACE_')) {
    throw new Error('ELEVENLABS_API_KEY is not set. Add it as a Cloudflare Worker secret to enable ElevenLabs voice.')
  }

  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 4500)
  if (!cleanText) throw new Error('Text is required for speech generation.')

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
  const modelId = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: cleanText,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    const details = await res.text().catch(() => '')
    throw new Error(`ElevenLabs voice failed (${res.status}). ${details}`.trim())
  }

  return res.arrayBuffer()
}
