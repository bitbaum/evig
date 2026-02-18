'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'
import type { Workshop, WorkshopInstanceWithDetails, InstanceFormData, InstanceFiltersState } from './types'
import { initialFormData } from './types'

export function useWorkshopInstances() {
  const { data: session, status: sessionStatus } = useSession()

  const [instances, setInstances] = useState<WorkshopInstanceWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState<InstanceFiltersState>({
    workshopId: '',
    status: 'all',
    upcoming: false,
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
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadWorkshops()
      loadInstances()
    }
  }, [sessionStatus, loadWorkshops, loadInstances])

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
          status: formData.status,
        }),
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
    } catch {
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
        method: 'DELETE',
      })

      if (response.ok) {
        loadInstances()
      } else {
        const data = await response.json()
        alert(data.message || 'Fehler beim Löschen')
      }
    } catch {
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
      status: instance.status,
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
        return { label: 'Geplant', className: 'bg-blue-100 text-blue-800' }
      case 'cancelled':
        return { label: 'Abgesagt', className: 'bg-red-100 text-red-800' }
      case 'completed':
        return { label: 'Abgeschlossen', className: 'bg-green-100 text-green-800' }
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' }
    }
  }

  return {
    // Auth
    session,
    sessionStatus,
    // Data
    instances,
    workshops,
    loading: sessionStatus === 'loading' || loading,
    error,
    // Filters
    filters,
    setFilters,
    // Modal
    showCreateModal,
    setShowCreateModal,
    editingInstance,
    formData,
    setFormData,
    submitting,
    // Actions
    handleCreateOrUpdate,
    handleDelete,
    openEditModal,
    closeModal,
    getStatusBadge,
  }
}
