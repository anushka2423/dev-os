'use client'

import type { ContractType } from '@/types'

interface ContractTypeSelectorProps {
  value: ContractType | null
  onChange: (type: ContractType) => void
}

export default function ContractTypeSelector({ value, onChange }: ContractTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ink-600">Contract type</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as ContractType)}
        className="w-full rounded-lg px-3 py-2 text-sm border border-line-200 bg-white text-ink-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50"
      >
        <option value="" disabled>Select contract type…</option>
        <option value="NDA">Non-Disclosure Agreement (NDA)</option>
        <option value="MSA">Master Service Agreement (MSA)</option>
      </select>
    </div>
  )
}
