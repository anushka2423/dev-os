import OpenAI from 'openai'
import { z } from 'zod'
import {
  STANDARD_TERMS,
  buildExtractionSystemPrompt,
  buildExtractionUserMessage,
  EXTRACTION_RETRY_PROMPT,
} from './prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const KeyTermSchema = z.object({
  term_name: z.string().min(1),
  value: z.string().default(''),
  page_number: z.number().int().min(0),
  confidence_score: z.number().min(0).max(100),
  source_sentence: z.string().default(''),
})

const ExtractionResponseSchema = z.object({
  terms: z.array(KeyTermSchema),
})

export type KeyTermResult = z.infer<typeof KeyTermSchema>

class ExtractionError extends Error {
  code = 'AI_PARSE_FAILED'
}
class OpenAIUnavailableError extends Error {
  code = 'AI_UNAVAILABLE'
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

async function callOpenAI(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages,
    })
    return response.choices[0].message.content!
  })
}

export async function extractKeyTerms(
  contractText: string,
  contractType: 'NDA' | 'MSA',
  customTermNames: string[]
): Promise<KeyTermResult[]> {
  const standardTerms = [...STANDARD_TERMS[contractType]]
  const termNames = [...standardTerms, ...customTermNames]

  const systemPrompt = buildExtractionSystemPrompt()
  const userMessage = buildExtractionUserMessage(contractType, termNames, contractText)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  let rawContent: string
  try {
    rawContent = await callOpenAI(messages)
  } catch {
    throw new OpenAIUnavailableError('OpenAI is unavailable')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    // One retry with correction prompt
    try {
      const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        { role: 'assistant', content: rawContent },
        { role: 'user', content: EXTRACTION_RETRY_PROMPT },
      ]
      const retryContent = await callOpenAI(retryMessages)
      parsed = JSON.parse(retryContent)
    } catch {
      throw new ExtractionError('Failed to parse AI response as JSON after retry')
    }
  }

  const validated = ExtractionResponseSchema.safeParse(parsed)
  if (!validated.success) {
    throw new ExtractionError('AI response did not match expected schema')
  }

  // Drop invalid terms and log warnings
  return validated.data.terms.filter((term) => {
    const valid = term.term_name.length > 0
    if (!valid) console.warn('[extract] Dropping invalid term:', term)
    return valid
  })
}
