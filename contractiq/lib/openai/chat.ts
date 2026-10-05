import OpenAI from 'openai'
import { buildChatSystemPrompt } from './prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  content: string
  pageCitations: number[]
}

function extractPageCitations(text: string): number[] {
  const matches = [...text.matchAll(/\[Page (\d+)\]/gi)]
  const pages = matches.map((m) => parseInt(m[1], 10)).filter((n) => n > 0)
  return [...new Set(pages)]
}

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  const delays = [1000, 2000, 4000]
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts - 1) throw err
      await new Promise((r) => setTimeout(r, delays[i]))
    }
  }
  throw new Error('unreachable')
}

export async function sendChatMessage(
  contractText: string,
  contractType: 'NDA' | 'MSA',
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResult> {
  const systemPrompt = buildChatSystemPrompt(contractType, contractText)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      temperature: 0.4,
      max_tokens: 1000,
      messages,
    })
  )

  const content = response.choices[0].message.content ?? ''
  const pageCitations = extractPageCitations(content)

  return { content, pageCitations }
}
