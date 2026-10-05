'use client'

import Spinner from './spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
  secondary: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 disabled:opacity-50',
  ghost: 'bg-transparent text-ink-600 hover:bg-line-100 disabled:opacity-50',
  danger: 'bg-red-500 text-white hover:bg-red-700 disabled:opacity-50',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-10',
  lg: 'px-6 py-3 text-base h-12',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading && <Spinner size="sm" color={variant === 'primary' ? 'white' : undefined} />}
      {children}
    </button>
  )
}
