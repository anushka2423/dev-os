'use client'

import { useState, useRef } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target
    setValue(el.value)
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const charCount = value.length
  const nearLimit = charCount > 900

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask something about this contract…"
          maxLength={1000}
          rows={1}
          disabled={isLoading}
          className="w-full resize-none rounded-lg border border-line-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 disabled:opacity-50"
          style={{ minHeight: '40px', maxHeight: '96px' }}
        />
        {nearLimit && (
          <span className={`absolute right-2 bottom-2 text-[10px] ${charCount >= 1000 ? 'text-red-700' : 'text-ink-400'}`}>
            {charCount}/1000
          </span>
        )}
      </div>
      <button
        onClick={submit}
        disabled={!value.trim() || isLoading}
        className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        aria-label="Send"
      >
        ➤
      </button>
    </div>
  )
}
