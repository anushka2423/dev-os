import type { ContractType } from '@/types'

interface EmptyChatProps {
  contractType: ContractType
  onPromptClick: (prompt: string) => void
}

const PROMPTS: Record<ContractType, string[]> = {
  NDA: [
    'What are the confidentiality obligations?',
    'How long does this NDA last?',
    'What happens if either party breaches?',
  ],
  MSA: [
    'What is the liability cap?',
    'What are the payment terms?',
    'How can either party terminate?',
  ],
}

export default function EmptyChat({ contractType, onPromptClick }: EmptyChatProps) {
  const prompts = PROMPTS[contractType]

  return (
    <div className="text-center py-2">
      <p className="text-xs text-ink-400 mb-3">Ask anything about this {contractType}</p>
      <div className="flex flex-col gap-1.5">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPromptClick(p)}
            className="text-left text-xs px-3 py-2 rounded-lg border border-line-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
