'use client'

import useSWR from 'swr'
import type { GetChatHistoryResponse, SendChatMessageResponse } from '@/types'

export function useChatMessages(contractId: string, sessionId: string) {
  const key = contractId && sessionId
    ? `/api/chat/${contractId}?session_id=${sessionId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<GetChatHistoryResponse>(key, {
    revalidateOnFocus: false,
  })

  async function sendMessage(message: string): Promise<void> {
    const optimisticUserMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      page_citations: [] as number[],
      created_at: new Date().toISOString(),
    }

    await mutate(
      async (current) => {
        const res = await fetch(`/api/chat/${contractId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message ?? 'Failed to send message')
        }
        const aiMsg: SendChatMessageResponse = await res.json()
        return {
          session_id: sessionId,
          messages: [
            ...(current?.messages ?? []),
            optimisticUserMsg,
            {
              id: aiMsg.message_id,
              role: aiMsg.role,
              content: aiMsg.content,
              page_citations: aiMsg.page_citations,
              created_at: aiMsg.created_at,
            },
          ],
        }
      },
      {
        optimisticData: (current) => ({
          session_id: sessionId,
          messages: [...(current?.messages ?? []), optimisticUserMsg],
        }),
        rollbackOnError: true,
      }
    )
  }

  return {
    messages: data?.messages ?? [],
    isLoading,
    error,
    sendMessage,
  }
}
