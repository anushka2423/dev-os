'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function NavBar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-bg-surface border-b border-line-200 z-50 flex items-center justify-between px-6">
      <Link href="/dashboard" className="text-lg font-bold text-ink-900 hover:text-blue-600 transition-colors">
        ContractIQ
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            + New Contract
          </Link>
          <span className="text-sm text-ink-400 max-w-[180px] truncate hidden sm:block">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-ink-600 hover:text-ink-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
