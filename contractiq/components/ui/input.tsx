import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-ink-600">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-lg px-3 py-2 text-sm border bg-white text-ink-900 placeholder:text-ink-400 transition-colors
          ${error ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20' : 'border-line-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  )
})

export default Input
