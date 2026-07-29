'use client'

interface BucketHeaderProps {
  icon: React.ReactNode
  label: string
  count: number
  accent: string
}

export function BucketHeader({ icon, label, count, accent }: BucketHeaderProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-subtle ${accent}`}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
      <span className="ml-auto text-xs text-text-tertiary tabular-nums">{count}</span>
    </div>
  )
}
