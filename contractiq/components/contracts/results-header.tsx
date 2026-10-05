import Badge from '@/components/ui/badge'
import type { ContractType } from '@/types'

interface ResultsHeaderProps {
  contractName: string
  contractType: ContractType
  createdAt: string
}

export default function ResultsHeader({ contractName, contractType, createdAt }: ResultsHeaderProps) {
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="border-b border-line-200 bg-bg-surface">
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-base font-semibold text-ink-900 truncate max-w-[400px]" title={contractName}>
          {contractName}
        </h1>
        <Badge variant={contractType === 'NDA' ? 'blue' : 'purple'}>{contractType}</Badge>
        <span className="text-xs text-ink-400">Reviewed {date}</span>
      </div>

      {/* Legal disclaimer — non-dismissible */}
      <div className="px-6 py-2 bg-orange-50 border-t border-orange-500/20 flex items-start gap-2">
        <span className="text-orange-700 text-xs mt-px flex-shrink-0">⚠</span>
        <p className="text-xs text-orange-700">
          This is an AI-assisted review tool, not legal advice. Always verify critical terms with a
          qualified lawyer.
        </p>
      </div>
    </div>
  )
}
