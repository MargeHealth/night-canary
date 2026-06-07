import Anthropic from '@anthropic-ai/sdk'

// Lazy: only instantiate when chat() is called.
let cached: Anthropic | null = null
function getClient(): Anthropic {
  if (cached) return cached
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.startsWith('REPLACE_')) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it in Vercel project settings → Environment Variables and redeploy.'
    )
  }
  cached = new Anthropic({ apiKey })
  return cached
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function chat(opts: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}): Promise<string> {
  const client = getClient()
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 1024,
    system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
    messages: opts.messages,
  })
  const block = res.content.find(b => b.type === 'text')
  return block && block.type === 'text' ? block.text : ''
}
