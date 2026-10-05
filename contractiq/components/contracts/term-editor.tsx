'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import { useToast } from '@/contexts/toast-context'
import type { KeyTerm } from '@/types'

interface TermEditorProps {
  term: KeyTerm
  onSaved: (updated: Pick<KeyTerm, 'id' | 'value' | 'original_value' | 'is_edited'>) => void
}

export default function TermEditor({ term, onSaved }: TermEditorProps) {
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState(term.value)

  if (!isEditing) {
    return (
      <button
        onClick={() => { setDraft(term.value); setIsEditing(true) }}
        className="block w-full text-left text-sm text-ink-900 hover:text-blue-700 cursor-pointer py-0.5 rounded transition-colors"
        title="Click to edit"
      >
        {term.value || <span className="text-ink-400 italic">Not found</span>}
      </button>
    )
  }

  async function save() {
    if (!draft.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/key-terms/${term.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: draft.trim() }),
      })
      if (!res.ok) throw new Error('save failed')
      const updated = await res.json()
      onSaved(updated)
      setIsEditing(false)
    } catch {
      showToast('Failed to save — please try again', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        className="w-full text-sm border border-blue-600 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-50 text-ink-900"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={save} isLoading={isSaving} disabled={!draft.trim()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
