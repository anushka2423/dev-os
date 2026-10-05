import Button from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-500">
      <span className="text-red-700 text-lg leading-none mt-0.5">⚠</span>
      <div className="flex-1">
        <p className="text-sm text-ink-900">{message}</p>
        {onRetry && (
          <div className="mt-2">
            <Button variant="danger" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
