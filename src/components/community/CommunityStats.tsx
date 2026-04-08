/**
 * CommunityStats — Reusable community metrics display
 *
 * Shows key platform statistics. Currently uses placeholder numbers.
 * TODO: Create API endpoint to return real counts from DB.
 */

interface CommunityStatsProps {
  className?: string
}

const COMMUNITY_STATS = [
  { label: 'Mitglieder', value: '100+' },
  { label: 'Inserate', value: '50+' },
  { label: 'Reparaturen', value: '30+' },
  { label: 'Workshops', value: '20+' },
]

export function CommunityStats({ className = '' }: CommunityStatsProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-600 ${className}`}>
      {COMMUNITY_STATS.map((stat) => (
        <span key={stat.label} className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{stat.value}</span>
          {stat.label}
        </span>
      ))}
    </div>
  )
}
