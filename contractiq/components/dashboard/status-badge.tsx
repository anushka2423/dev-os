import type { ContractStatus } from '@/types'

interface StatusBadgeProps {
  status: ContractStatus
}

const config: Record<ContractStatus, { bg: string; text: string; label: string }> = {
  uploaded: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Uploaded' },
  processing: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Processing…' },
  processed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Processed' },
  error: { bg: 'bg-red-50', text: 'text-red-700', label: 'Error' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text, label } = config[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status ?? 'Unknown' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  )
}
