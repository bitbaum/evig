import { type LucideIcon, Package } from 'lucide-react'
import { EmptyState as UIEmptyState } from '@/components/ui/EmptyState'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon = Package,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  const actionNode = action ? (
    action.href ? (
      <a
        href={action.href}
        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        {action.label}
      </a>
    ) : (
      <button
        onClick={action.onClick}
        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        {action.label}
      </button>
    )
  ) : undefined

  return (
    <UIEmptyState
      icon={icon}
      title={title}
      description={message}
      action={actionNode}
      className={className}
    />
  )
}
