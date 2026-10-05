'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'

interface TextViewerProps {
  contractId: string
  targetPage: number
}

interface ContractTextResponse {
  contract_text: string
}

function parsePages(text: string): { page: number; content: string }[] {
  const parts = text.split(/\n?\[PAGE (\d+)\]\n?/)
  const pages: { page: number; content: string }[] = []
  for (let i = 1; i < parts.length; i += 2) {
    pages.push({ page: parseInt(parts[i], 10), content: parts[i + 1] ?? '' })
  }
  if (pages.length === 0 && text.trim()) {
    pages.push({ page: 1, content: text })
  }
  return pages
}

export default function TextViewer({ contractId, targetPage }: TextViewerProps) {
  const { data } = useSWR<ContractTextResponse>(`/api/contracts/${contractId}/text`)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const target = containerRef.current.querySelector(`[data-page="${targetPage}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [targetPage])

  if (!data) {
    return <div className="p-6 text-sm text-ink-400">Loading document text…</div>
  }

  const pages = parsePages(data.contract_text)

  return (
    <div ref={containerRef} className="p-6 smooth-scroll">
      {pages.map(({ page, content }) => (
        <div key={page} data-page={page} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-line-200" />
            <span className="text-xs font-medium text-ink-400 px-2">Page {page}</span>
            <div className="h-px flex-1 bg-line-200" />
          </div>
          <pre className="font-mono text-xs text-ink-900 whitespace-pre-wrap leading-relaxed">
            {content.trim()}
          </pre>
        </div>
      ))}
    </div>
  )
}
