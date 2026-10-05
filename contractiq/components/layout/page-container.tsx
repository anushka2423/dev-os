interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const maxWidths = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full',
}

export default function PageContainer({ children, maxWidth = 'lg' }: PageContainerProps) {
  return (
    <div className={`mx-auto ${maxWidths[maxWidth]} px-4 sm:px-6 lg:px-8 py-8`}>
      {children}
    </div>
  )
}
