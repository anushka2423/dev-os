'use client'

import { useState } from 'react'
import ConfidenceBadge from './confidence-badge'
import TermEditor from './term-editor'
import Badge from '@/components/ui/badge'
import type { KeyTerm } from '@/types'

interface TermCardProps {
  term: KeyTerm
  onPageClick: (page: number) => void
  onTermUpdated: (updated: Pick<KeyTerm, 'id' | 'value' | 'original_value' | 'is_edited'>) => void
}

export default function TermCard({ term, onPageClick, onTermUpdated }: TermCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)

  return (
    <div className="border-b border-line-100 px-4 py-3 last:border-b-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-ink-900">{term.term_name}</span>
          {term.is_custom && <Badge variant="blue" size="sm">Custom</Badge>}
          {term.is_edited && <Badge variant="grey" size="sm">Edited</Badge>}
        </div>
        <ConfidenceBadge score={term.confidence_score} />
      </div>

      {/* Value + inline editor */}
      <TermEditor term={term} onSaved={onTermUpdated} />

      {/* Low confidence warning */}
      {term.confidence_score < 50 && (
        <div className="mt-2 flex items-start gap-1.5 px-2 py-1.5 rounded bg-red-50 border border-red-500/30">
          <span className="text-red-700 text-xs flex-shrink-0">⚠</span>
          <p className="text-xs text-red-700">
            Low confidence — we recommend verifying &ldquo;{term.term_name}&rdquo; directly in the document.
          </p>
        </div>
      )}

      {/* Footer: page link + why accordion */}
      <div className="mt-2 flex items-center gap-3">
        {term.page_number > 0 && (
          <button
            onClick={() => onPageClick(term.page_number)}
            className="text-xs text-blue-700 hover:underline font-medium"
          >
            Page {term.page_number}
          </button>
        )}
        <button
          onClick={() => setWhyOpen((v) => !v)}
          className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
        >
          {whyOpen ? '▲ Hide' : '▼ Why?'}
        </button>
      </div>

      {/* Source sentence accordion */}
      {whyOpen && (
        <div className="mt-2 pl-3 border-l-2 border-line-200">
          <p className="text-xs text-ink-600 italic leading-relaxed">
            {term.source_sentence || 'No source sentence available.'}
          </p>
        </div>
      )}
    </div>
  )
}
