import Spinner from '@/components/ui/spinner'

interface ProcessingProgressProps {
  step: 1 | 2 | 3
}

const steps = [
  'Extracting text from PDF…',
  'Analysing with AI…',
  'Compiling results…',
]

export default function ProcessingProgress({ step }: ProcessingProgressProps) {
  return (
    <div className="space-y-3">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isComplete = stepNum < step
        const isActive = stepNum === step

        return (
          <div key={label} className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {isComplete ? (
                <span className="text-green-500 text-lg">✓</span>
              ) : isActive ? (
                <Spinner size="sm" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-line-200" />
              )}
            </div>
            <span className={`text-sm ${isComplete ? 'text-green-700' : isActive ? 'text-ink-900 font-medium' : 'text-ink-400'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
