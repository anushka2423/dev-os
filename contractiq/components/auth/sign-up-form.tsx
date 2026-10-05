'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function SignUpForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(
        error.message.includes('User already registered')
          ? 'An account with this email already exists. Sign in instead.'
          : error.message
      )
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-bg-surface border border-line-200 rounded-xl p-8 shadow-sm">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-lg font-semibold text-ink-900 mb-2">Check your email</h2>
          <p className="text-sm text-ink-600">
            We sent a verification link to <strong>{email}</strong>. Click the link to activate your
            account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink-900">ContractIQ</h1>
        <p className="text-ink-600 mt-1 text-sm">Create your free account</p>
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
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            hint="Minimum 8 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-red-700">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-600">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
