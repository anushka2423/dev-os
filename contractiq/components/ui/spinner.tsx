interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = { sm: 16, md: 24, lg: 40 }

export default function Spinner({ size = 'md', color = '#125ACB' }: SpinnerProps) {
  const px = sizes[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
