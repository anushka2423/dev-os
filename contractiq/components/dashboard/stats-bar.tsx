interface StatsBarProps {
  stats: { total: number; processed: number; processing: number; error: number }
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-bg-surface border border-line-200 rounded-xl text-sm flex-wrap">
      <span className="text-ink-600">Total: <strong className="text-ink-900">{stats.total}</strong></span>
      <span className="text-green-700">Processed: <strong>{stats.processed}</strong></span>
      {stats.processing > 0 && (
        <span className="text-orange-700">Processing: <strong>{stats.processing}</strong></span>
      )}
      {stats.error > 0 && (
        <span className="text-red-700">Errors: <strong>{stats.error}</strong></span>
      )}
    </div>
  )
}
