'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'
import { VACANCY_STATUS, type VacancyStatus } from '@/config/hr-vacancies'
import { publicVacancyUrl } from '@/lib/hr/notifications'
import { buildVacancyShareText } from '@/config/hr-vacancies'
import type { VacancyFormData, VacancyListItem } from './types'
import { logger } from '@/lib/logger'

export function useHrVacancies() {
  const [postings, setPostings] = useState<VacancyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), UI_FEEDBACK_MS.SUCCESS)
  }

  const fetchPostings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      const qs = params.toString()
      const result = await apiFetch<{ postings: VacancyListItem[] }>(
        `/api/admin/hr/vacancies${qs ? `?${qs}` : ''}`,
      )
      if (!result.success) throw new Error(result.error || 'Laden fehlgeschlagen')
      setPostings(result.data?.postings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchPostings()
  }, [fetchPostings])

  const transitionStatus = async (id: string, status: VacancyStatus) => {
    setActionLoading(id)
    try {
      const result = await apiFetch(`/api/admin/hr/vacancies/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      })
      if (!result.success) throw new Error(result.error || 'Statuswechsel fehlgeschlagen')
      showSuccess('Status aktualisiert')
      await fetchPostings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Statuswechsel fehlgeschlagen')
    } finally {
      setActionLoading(null)
    }
  }

  const duplicateVacancy = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await apiFetch<VacancyListItem>(`/api/admin/hr/vacancies/${id}/duplicate`, {
        method: 'POST',
      })
      if (!result.success) throw new Error(result.error || 'Duplizieren fehlgeschlagen')
      showSuccess('Stelle dupliziert (Entwurf)')
      await fetchPostings()
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplizieren fehlgeschlagen')
      return null
    } finally {
      setActionLoading(null)
    }
  }

  const copyPublicLink = async (slug: string) => {
    const url = publicVacancyUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Link kopiert')
    } catch {
      setError('Link konnte nicht kopiert werden')
    }
  }

  const shareVacancy = async (title: string, slug: string) => {
    const url = publicVacancyUrl(slug)
    const text = buildVacancyShareText(title, url)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        logger.info('Web Share cancelled or failed', { error: err })
      }
    }
    await copyPublicLink(slug)
  }

  const createVacancy = async (data: VacancyFormData, publish: boolean) => {
    const payload = {
      title: data.title,
      summary: data.summary || null,
      description: data.description,
      role_track: data.role_track,
      department: data.department || null,
      location: data.location || null,
      remote_ok: data.remote_ok,
      hours_per_week: data.hours_per_week ? parseInt(data.hours_per_week, 10) : null,
      start_date: data.start_date || null,
      application_deadline: data.application_deadline
        ? new Date(data.application_deadline).toISOString()
        : null,
      compensation_public_text: data.compensation_public_text || null,
      show_on_get_involved: data.show_on_get_involved,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      initial_status: publish ? VACANCY_STATUS.PUBLISHED : VACANCY_STATUS.DRAFT,
    }

    const result = await apiFetch<VacancyListItem>('/api/admin/hr/vacancies', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!result.success) throw new Error(result.error || 'Erstellen fehlgeschlagen')
    return result.data
  }

  const updateVacancy = async (id: string, data: VacancyFormData) => {
    const payload = {
      title: data.title,
      summary: data.summary || null,
      description: data.description,
      role_track: data.role_track,
      department: data.department || null,
      location: data.location || null,
      remote_ok: data.remote_ok,
      hours_per_week: data.hours_per_week ? parseInt(data.hours_per_week, 10) : null,
      start_date: data.start_date || null,
      application_deadline: data.application_deadline
        ? new Date(data.application_deadline).toISOString()
        : null,
      compensation_public_text: data.compensation_public_text || null,
      show_on_get_involved: data.show_on_get_involved,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
    }

    const result = await apiFetch<VacancyListItem>(`/api/admin/hr/vacancies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!result.success) throw new Error(result.error || 'Speichern fehlgeschlagen')
    return result.data
  }

  return {
    postings,
    loading,
    error,
    setError,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionLoading,
    successMessage,
    fetchPostings,
    transitionStatus,
    duplicateVacancy,
    copyPublicLink,
    shareVacancy,
    createVacancy,
    updateVacancy,
  }
}
