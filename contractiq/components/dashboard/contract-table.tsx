'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from './status-badge'
import Badge from '@/components/ui/badge'
import type { DashboardContract } from '@/types'

interface ContractTableProps {
  contracts: DashboardContract[]
}

type SortKey = 'page_count' | 'created_at'
type SortDir = 'asc' | 'desc'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ContractTable({ contracts }: ContractTableProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() =>
    [...contracts].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    }),
    [contracts, sortKey, sortDir]
  )

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900 transition-colors"
      >
        {label}
        <span className="text-ink-400">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    )
  }

  return (
    <div className="bg-bg-surface border border-line-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-line-200 bg-bg-page">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 hidden sm:table-cell">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600">Status</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">
              <SortHeader label="Pages" field="page_count" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 hidden md:table-cell">Terms</th>
            <th className="text-left px-4 py-3">
              <SortHeader label="Reviewed" field="created_at" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr
              key={c.id}
              onClick={() => router.push(`/contracts/${c.id}`)}
              className="border-b border-line-100 last:border-b-0 cursor-pointer hover:bg-bg-page transition-colors"
            >
              <td className="px-4 py-3">
                <span className="block max-w-[240px] truncate font-medium text-ink-900" title={c.name}>
                  {c.name}
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <Badge variant={c.contract_type === 'NDA' ? 'blue' : 'purple'} size="sm">
                  {c.contract_type}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{c.page_count}</td>
              <td className="px-4 py-3 text-ink-600 hidden md:table-cell">
                {c.status === 'processed' ? c.term_count : '—'}
              </td>
              <td className="px-4 py-3 text-ink-400 text-xs">{relativeTime(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
