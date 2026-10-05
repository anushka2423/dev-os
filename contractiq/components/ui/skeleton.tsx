interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export default function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClass = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded]
  return (
    <div
      className={`animate-pulse bg-line-100 ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  )
}
