'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function SignInForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message.includes('Invalid login credentials')
          ? 'Incorrect email or password.'
          : error.message
      )
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink-900">ContractIQ</h1>
        <p className="text-ink-600 mt-1 text-sm">Sign in to your account</p>
      </div>

      <div className="bg-bg-surface border border-line-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-red-700">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">
            Get started free
          </Link>
        </p>
      </div>
    </div>
  )
}
