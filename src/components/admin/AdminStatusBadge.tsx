export interface StatusConfig {
  label: string
  color: string
}

interface AdminStatusBadgeProps {
  status: string
  config: Record<string, StatusConfig>
  fallbackColor?: string
}

export function AdminStatusBadge({
  status,
  config,
  fallbackColor = 'bg-surface-raised text-text-primary',
}: AdminStatusBadgeProps) {
  const entry = config[status]
  const label = entry?.label ?? status
  const color = entry?.color ?? fallbackColor

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${color}`}>
      {label}
    </span>
  )
}
