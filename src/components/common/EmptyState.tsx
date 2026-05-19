import { type LucideIcon, Package } from 'lucide-react'
import { EmptyState as UIEmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'

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
      <Button as="a" href={action.href} variant="primary" className="mt-4">
        {action.label}
      </Button>
    ) : (
      <Button onClick={action.onClick} variant="primary" className="mt-4">
        {action.label}
      </Button>
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
