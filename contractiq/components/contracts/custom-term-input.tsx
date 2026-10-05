'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'

interface CustomTermInputProps {
  contractId: string
  customTerms: string[]
  onTermsChange: (terms: string[]) => void
  disabled?: boolean
}

const MAX_CUSTOM_TERMS = parseInt(process.env.NEXT_PUBLIC_MAX_CUSTOM_TERMS ?? '5', 10)

export default function CustomTermInput({ contractId, customTerms, onTermsChange, disabled }: CustomTermInputProps) {
  const supabase = createClient()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function addTerm() {
    const name = input.trim()
    setError(null)

    if (!name) { setError('Term name cannot be empty.'); return }
    if (name.length > 100) { setError('Term name must be under 100 characters.'); return }
    if (customTerms.length >= MAX_CUSTOM_TERMS) { setError(`Maximum ${MAX_CUSTOM_TERMS} custom terms reached.`); return }

    const { error: dbError } = await supabase.from('custom_key_terms').insert({
      contract_id: contractId,
      term_name: name,
    })

    if (dbError) { setError('Could not add term. Please try again.'); return }

    onTermsChange([...customTerms, name])
    setInput('')
  }

  return (
    <div className="bg-bg-surface border border-line-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-ink-900 mb-1">Custom terms (optional)</h2>
      <p className="text-xs text-ink-400 mb-3">Add up to {MAX_CUSTOM_TERMS} additional terms to extract.</p>

      {customTerms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {customTerms.map((t) => (
            <Badge key={t} variant="blue">{t} · Custom</Badge>
          ))}
        </div>
      )}

      {customTerms.length < MAX_CUSTOM_TERMS && !disabled && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Renewal Clause"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addTerm}>
            + Add
          </Button>
        </div>
      )}

      {customTerms.length >= MAX_CUSTOM_TERMS && (
        <p className="text-xs text-ink-400 mt-1">Maximum {MAX_CUSTOM_TERMS} custom terms reached.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}
