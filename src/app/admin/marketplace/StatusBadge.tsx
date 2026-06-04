'use client'

export function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[status]
  if (!cfg) return <span className="text-xs text-text-tertiary">{status}</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
