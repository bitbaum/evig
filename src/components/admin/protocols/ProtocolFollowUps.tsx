import { getFollowUpStatusColor } from '@/config/protocols'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface Props {
  followUps: NonNullable<StructuredNotes['follow_ups']>
}

export function ProtocolFollowUps({ followUps }: Props) {
  if (followUps.length === 0) return null

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Offene Punkte aus früheren Sitzungen
      </h2>
      <ul className="space-y-2">
        {followUps.map((fu, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full mt-0.5 ${getFollowUpStatusColor(fu.status)}`}>
              {fu.status || 'offen'}
            </span>
            <span className="text-gray-700 text-sm">{fu.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
