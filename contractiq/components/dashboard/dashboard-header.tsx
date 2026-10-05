import Link from 'next/link'

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-ink-900">My Contracts</h1>
      <Link
        href="/upload"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        + New Contract
      </Link>
    </div>
  )
}
