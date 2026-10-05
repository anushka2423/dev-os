interface ConfidenceBadgeProps {
  score: number
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const tier = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low'

  const styles = {
    high: 'bg-green-50 text-green-700',
    mid: 'bg-orange-50 text-orange-700',
    low: 'bg-red-50 text-red-700',
  }

  const icons = { high: '✓', mid: '~', low: '⚠' }
  const labels = {
    high: 'High confidence — AI is confident in this extraction',
    mid: 'Medium confidence — verify this term in the document',
    low: 'Low confidence — we recommend verifying this directly in the document',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}
      title={labels[tier]}
    >
      {icons[tier]} {Math.round(score)}%
    </span>
  )
}
