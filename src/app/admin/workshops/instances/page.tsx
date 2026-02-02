'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  ArrowLeft,
  GraduationCap,
  Loader2,
  X,
  Save
} from 'lucide-react'
import { logger } from '@/lib/logger'
import type { Workshop, WorkshopInstanceWithDetails } from '@/components/workshops/types'

interface InstanceFormData {
  workshopId: string
  startDate: string
  endDate: string
  location: string
  instructor: string
  maxParticipants: string
  notes: string
  status: string
}

const initialFormData: InstanceFormData = {
  workshopId: '',
  startDate: '',
  endDate: '',
  location: 'RevampIT, Birmensdorferstr. 379, 8055 Zürich',
  instructor: '',
  maxParticipants: '',
  notes: '',
  status: 'scheduled'
}

export default function AdminWorkshopInstancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [instances, setInstances] = useState<WorkshopInstanceWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    workshopId: '',
    status: 'all',
    upcoming: false
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInstance, setEditingInstance] = useState<WorkshopInstanceWithDetails | null>(null)
  const [formData, setFormData] = useState<InstanceFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const loadWorkshops = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/workshops/list')
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.data.workshops)
      }
    } catch (err) {
      logger.error('Error loading workshops', { error: err })
    }
  }, [])

  const loadInstances = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.workshopId) params.set('workshopId', filters.workshopId)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.upcoming) params.set('upcoming', 'true')

      const response = await fetch(`/api/admin/workshops/instances?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInstances(data.data.instances)
      } else {
        setError('Fehler beim Laden der Workshop-Termine')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (status === 'authenticated') {
      loadWorkshops()
      loadInstances()
    }
  }, [status, loadWorkshops, loadInstances])

  const handleCreateOrUpdate = async () => {
    setSubmitting(true)
    setError('')

    try {
      const isEditing = !!editingInstance
      const url = isEditing
        ? `/api/admin/workshops/instances/${editingInstance.id}`
        : '/api/admin/workshops/instances'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: formData.workshopId,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          location: formData.location,
          instructor: formData.instructor || null,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          notes: formData.notes || null,
          status: formData.status
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setEditingInstance(null)
        setFormData(initialFormData)
        loadInstances()
      } else {
        const data = await response.json()
        setError(data.message || 'Fehler beim Speichern')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (instanceId: string) => {
    if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/workshops/instances/${instanceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadInstances()
      } else {
        const data = await response.json()
        alert(data.message || 'Fehler beim Löschen')
      }
    } catch (err) {
      alert('Netzwerkfehler')
    }
  }

  const openEditModal = (instance: WorkshopInstanceWithDetails) => {
    setEditingInstance(instance)
    setFormData({
      workshopId: instance.workshop_id,
      startDate: new Date(instance.start_date).toISOString().slice(0, 16),
      endDate: instance.end_date ? new Date(instance.end_date).toISOString().slice(0, 16) : '',
      location: instance.location || '',
      instructor: instance.instructor || '',
      maxParticipants: instance.max_participants?.toString() || '',
      notes: instance.notes || '',
      status: instance.status
    })
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingInstance(null)
    setFormData(initialFormData)
    setError('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Geplant</span>
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Abgesagt</span>
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Abgeschlossen</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workshop-Termine</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie Termine für Ihre Workshops
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/workshops"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Workshop-Vorschläge
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neuer Termin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Workshop</label>
              <select
                value={filters.workshopId}
                onChange={(e) => setFilters(prev => ({ ...prev, workshopId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle Workshops</option>
                {workshops.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle</option>
                <option value="scheduled">Geplant</option>
                <option value="cancelled">Abgesagt</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={filters.upcoming}
                  onChange={(e) => setFilters(prev => ({ ...prev, upcoming: e.target.checked }))}
                  className="mr-2"
                />
                Nur zukünftige
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !showCreateModal && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Instances List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Termine ({instances.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {instances.map((instance) => (
              <div key={instance.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {instance.workshop_title}
                      </h3>
                      {getStatusBadge(instance.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(instance.start_date).toLocaleDateString('de-CH', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className={instance.current_participants >= (instance.max_participants || 10) ? 'text-red-600 font-medium' : ''}>
                          {instance.current_participants}/{instance.max_participants || '∞'}
                        </span>
                        {instance.pending_count > 0 && (
                          <span className="text-yellow-600">({instance.pending_count} ausstehend)</span>
                        )}
                      </div>

                      {instance.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {instance.location}
                        </div>
                      )}

                      {instance.instructor && (
                        <div className="text-gray-500">
                          Leitung: {instance.instructor}
                        </div>
                      )}
                    </div>

                    {instance.notes && (
                      <p className="text-sm text-gray-500">{instance.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/workshops/instances/${instance.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Link>

                    <button
                      onClick={() => openEditModal(instance)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Bearbeiten
                    </button>

                    {instance.current_participants === 0 && (
                      <button
                        onClick={() => handleDelete(instance.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {instances.length === 0 && !loading && (
              <div className="px-6 py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Termine gefunden</h3>
                <p className="text-gray-600 mb-4">
                  Erstellen Sie einen neuen Termin für einen Workshop.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Termin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingInstance ? 'Termin bearbeiten' : 'Neuer Termin'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workshop *
                </label>
                <select
                  value={formData.workshopId}
                  onChange={(e) => setFormData(prev => ({ ...prev, workshopId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingInstance}
                >
                  <option value="">Workshop auswählen...</option>
                  {workshops.map(w => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ende
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="z.B. RevampIT, Birmensdorferstr. 379, 8055 Zürich"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leitung
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="Name des Kursleiters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max. Teilnehmer
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="Standard vom Workshop"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Geplant</option>
                  <option value="cancelled">Abgesagt</option>
                  <option value="completed">Abgeschlossen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Interne Notizen..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={submitting || !formData.workshopId || !formData.startDate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingInstance ? 'Speichern' : 'Erstellen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
