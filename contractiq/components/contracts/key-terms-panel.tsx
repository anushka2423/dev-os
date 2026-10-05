import TermCard from './term-card'
import type { KeyTerm } from '@/types'

interface KeyTermsPanelProps {
  keyTerms: KeyTerm[]
  onPageClick: (page: number) => void
  onTermUpdated: (updated: Pick<KeyTerm, 'id' | 'value' | 'original_value' | 'is_edited'>) => void
}

export default function KeyTermsPanel({ keyTerms, onPageClick, onTermUpdated }: KeyTermsPanelProps) {
  const located = keyTerms.filter((t) => t.page_number > 0).sort((a, b) => a.page_number - b.page_number)
  const notFound = keyTerms.filter((t) => t.page_number === 0)
  const sorted = [...located, ...notFound]

  return (
    <div>
      <div className="px-4 py-3 border-b border-line-200 sticky top-0 bg-bg-surface z-10">
        <h2 className="text-sm font-semibold text-ink-900">
          Key Terms{' '}
          <span className="font-normal text-ink-400">({keyTerms.length} found)</span>
        </h2>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-ink-400">
            No terms were extracted. Try adding custom terms and re-processing.
          </p>
        </div>
      ) : (
        <div>
          {sorted.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              onPageClick={onPageClick}
              onTermUpdated={onTermUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
