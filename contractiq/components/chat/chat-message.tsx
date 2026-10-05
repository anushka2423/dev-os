import type { GetChatHistoryResponse } from '@/types'

type MessageItem = GetChatHistoryResponse['messages'][number]

interface ChatMessageProps {
  message: MessageItem
  onPageClick: (page: number) => void
}

function renderContent(content: string, onPageClick: (page: number) => void) {
  const parts = content.split(/(\[Page \d+\])/gi)
  return parts.map((part, i) => {
    const match = part.match(/\[Page (\d+)\]/i)
    if (match) {
      const page = parseInt(match[1], 10)
      return (
        <button
          key={i}
          onClick={() => onPageClick(page)}
          className="text-blue-700 font-semibold underline hover:text-blue-600 mx-0.5"
        >
          Page {page}
        </button>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ChatMessage({ message, onPageClick }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-line-100 text-ink-900 border border-line-200 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <span>{renderContent(message.content, onPageClick)}</span>
        )}
      </div>
    </div>
  )
}
