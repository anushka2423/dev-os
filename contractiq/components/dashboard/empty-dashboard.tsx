import Link from 'next/link'

export default function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center mt-24 text-center">
      <div className="text-5xl mb-4">📄</div>
      <h2 className="text-lg font-semibold text-ink-900 mb-2">No contracts yet</h2>
      <p className="text-sm text-ink-600 max-w-sm mb-6">
        Upload your first NDA or MSA to get started. Analysis takes less than a minute.
      </p>
      <Link
        href="/upload"
        className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
      >
        Upload your first contract
      </Link>
    </div>
  )
}
