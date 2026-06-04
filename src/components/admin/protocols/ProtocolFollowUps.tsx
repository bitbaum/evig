import { getFollowUpStatusColor } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface Props {
  followUps: NonNullable<StructuredNotes['follow_ups']>
}

export function ProtocolFollowUps({ followUps }: Props) {
  if (followUps.length === 0) return null

  return (
    <div className="bg-surface-base rounded-lg border p-6">
      <Heading level={2} className="text-lg text-text-primary mb-3">
        Offene Punkte aus früheren Sitzungen
      </Heading>
      <ul className="space-y-2">
        {followUps.map((fu, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full mt-0.5 ${getFollowUpStatusColor(fu.status)}`}>
              {fu.status || 'offen'}
            </span>
            <span className="text-text-secondary text-sm">{fu.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
