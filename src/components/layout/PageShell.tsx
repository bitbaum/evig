import { cn } from '@/lib/utils'

const MAX_WIDTH = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
} as const

interface PageShellProps {
  children: React.ReactNode
  maxWidth?: keyof typeof MAX_WIDTH
  py?: string
  className?: string
}

export function PageShell({
  children,
  maxWidth = '7xl',
  py = 'py-8 sm:py-12',
  className,
}: PageShellProps) {
  return (
    <div className={cn(MAX_WIDTH[maxWidth], 'mx-auto px-4 sm:px-6 lg:px-8', py, className)}>
      {children}
    </div>
  )
}
