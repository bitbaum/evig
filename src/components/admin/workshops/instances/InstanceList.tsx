'use client'

import { Link } from '@/i18n/navigation'
import {
  Calendar,
  Plus,
  GraduationCap,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import type { WorkshopInstanceWithDetails } from './types'
import { formatDateTime } from '@/lib/date-formats'

interface InstanceListProps {
  instances: WorkshopInstanceWithDetails[]
  loading: boolean
  onEdit: (instance: WorkshopInstanceWithDetails) => void
  onDelete: (instanceId: string) => void
  onCreateNew: () => void
  getStatusBadge: (status: string) => { label: string; className: string }
}

export function InstanceList({
  instances,
  loading,
  onEdit,
  onDelete,
  onCreateNew,
  getStatusBadge,
}: InstanceListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b border-neutral-200">
        <Heading level={2} className="text-lg text-neutral-900">
          Termine ({instances.length})
        </Heading>
      </div>

      <div className="divide-y divide-neutral-200">
        {instances.map((instance) => {
          const badge = getStatusBadge(instance.status)
          return (
            <div key={instance.id} className="p-6 hover:bg-neutral-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="w-5 h-5 text-primary-600" />
                    <Heading level={3} className="text-lg text-neutral-900 truncate">
                      {instance.workshop_title}
                    </Heading>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(instance.start_date)}
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className={instance.current_participants >= (instance.max_participants || 10) ? 'text-error-600 font-medium' : ''}>
                        {instance.current_participants}/{instance.max_participants || '\u221E'}
                      </span>
                      {instance.pending_count > 0 && (
                        <span className="text-warning-600">({instance.pending_count} ausstehend)</span>
                      )}
                    </div>

                    {instance.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {instance.location}
                      </div>
                    )}

                    {instance.instructor && (
                      <div className="text-neutral-500">
                        Leitung: {instance.instructor}
                      </div>
                    )}
                  </div>

                  {instance.notes && (
                    <p className="text-sm text-neutral-500">{instance.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button as={Link} href={`/admin/workshops/instances/${instance.id}`} variant="outline" size="sm" className="gap-1">
                    <Eye className="w-4 h-4" />
                    Details
                  </Button>

                  <Button onClick={() => onEdit(instance)} variant="outline" size="sm" className="gap-1">
                    <Edit className="w-4 h-4" />
                    Bearbeiten
                  </Button>

                  {instance.current_participants === 0 && (
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => onDelete(instance.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {instances.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg text-neutral-900 mb-2">Keine Termine gefunden</Heading>
            <p className="text-neutral-600 mb-4">
              Erstelle einen neuen Termin für einen Workshop.
            </p>
            <Button onClick={onCreateNew} variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Neuer Termin
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
