interface BadgeProps {
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'grey' | 'purple'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const variantClasses = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
  grey: 'bg-line-100 text-ink-600',
  purple: 'bg-purple-50 text-purple-700',
}

export default function Badge({ variant = 'blue', size = 'md', children, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
