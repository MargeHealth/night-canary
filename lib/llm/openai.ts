import OpenAI from 'openai'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

// Lazy: only instantiate when an OpenAI-backed route is called.
// This lets the project build without OPENAI_API_KEY set.
let cached: OpenAI | null = null
function getClient(): OpenAI {
  if (cached) return cached
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith('REPLACE_')) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it as a Cloudflare Worker secret to enable OpenAI chat and transcription.'
    )
  }
  cached = new OpenAI({ apiKey })
  return cached
}

export function hasOpenAIKey(): boolean {
  const apiKey = process.env.OPENAI_API_KEY
  return Boolean(apiKey && !apiKey.startsWith('REPLACE_'))
}

export async function transcribe(audio: File | Blob, filename = 'audio.webm'): Promise<string> {
  const client = getClient()
  const file = audio instanceof File ? audio : new File([audio], filename, { type: 'audio/webm' })
  const res = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })
  return res.text
}

export async function chat(opts: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}): Promise<string> {
  const client = getClient()
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const res = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: opts.system },
      ...opts.messages.map(message => ({
        role: message.role,
        content: message.content,
      })),
    ],
  })
  return res.choices[0]?.message?.content ?? ''
}
