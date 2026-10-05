'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatMessages } from '@/hooks/use-chat-messages'
import ChatMessage from './chat-message'
import ChatInput from './chat-input'
import EmptyChat from './empty-chat'
import TypingIndicator from './typing-indicator'
import type { ContractType } from '@/types'

interface ChatTabProps {
  sessionId: string
  contractId: string
  contractType?: ContractType
  onPageCitation: (page: number) => void
}

export default function ChatTab({ sessionId, contractId, contractType = 'NDA', onPageCitation }: ChatTabProps) {
  const { messages, isLoading, sendMessage } = useChatMessages(contractId, sessionId)
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function handleSend(message: string) {
    setIsSending(true)
    try {
      await sendMessage(message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-line-200 bg-bg-surface flex flex-col" style={{ height: '320px' }}>
      <div className="px-4 py-2 border-b border-line-100 flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-900">Chat</span>
        <span className="text-xs text-ink-400">Ask anything about this contract</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? null : messages.length === 0 ? (
          <EmptyChat contractType={contractType} onPromptClick={handleSend} />
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onPageClick={onPageCitation} />
          ))
        )}
        {isSending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line-100 px-4 py-3">
        <ChatInput onSend={handleSend} isLoading={isSending} />
      </div>
    </div>
  )
}
