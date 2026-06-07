import { chat as anthropicChat } from './anthropic'
import { chat as openAiChat, hasOpenAIKey } from './openai'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

type Provider = 'openai' | 'anthropic'

function hasAnthropicKey(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY
  return Boolean(apiKey && !apiKey.startsWith('REPLACE_'))
}

function resolveProvider(): Provider {
  const requested = process.env.AI_PROVIDER?.toLowerCase()
  if (requested === 'openai' || requested === 'anthropic') return requested
  if (hasOpenAIKey()) return 'openai'
  if (hasAnthropicKey()) return 'anthropic'
  return 'openai'
}

export async function chat(opts: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}): Promise<string> {
  const provider = resolveProvider()
  if (provider === 'anthropic') return anthropicChat(opts)
  return openAiChat(opts)
}
