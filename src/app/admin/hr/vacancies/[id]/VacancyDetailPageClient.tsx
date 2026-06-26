'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { apiFetch } from '@/lib/api/client'
import {
  VacancyFormFields,
  VacancyCard,
  useHrVacancies,
} from '@/components/admin/hr'
import type { VacancyFormData, VacancyListItem } from '@/components/admin/hr/types'
import { ROLE_TRACKS } from '@/config/hr-vacancies'

function toForm(v: VacancyListItem): VacancyFormData {
  return {
    title: v.title,
    summary: v.summary ?? '',
    description: v.description,
    role_track: v.role_track as VacancyFormData['role_track'],
    department: v.department ?? '',
    location: v.location ?? '',
    remote_ok: v.remote_ok,
    hours_per_week: v.hours_per_week?.toString() ?? '',
    start_date: v.start_date ?? '',
    application_deadline: v.application_deadline
      ? new Date(v.application_deadline).toISOString().slice(0, 16)
      : '',
    compensation_public_text: v.compensation_public_text ?? '',
    show_on_get_involved: v.show_on_get_involved,
    seo_title: v.seo_title ?? '',
    seo_description: v.seo_description ?? '',
  }
}

export default function VacancyDetailPageClient({ id }: { id: string }) {
  const router = useRouter()
  const {
    updateVacancy,
    transitionStatus,
    duplicateVacancy,
    copyPublicLink,
    shareVacancy,
    actionLoading,
    successMessage,
  } = useHrVacancies()

  const [vacancy, setVacancy] = useState<VacancyListItem | null>(null)
  const [form, setForm] = useState<VacancyFormData | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch<VacancyListItem>(`/api/admin/hr/vacancies/${id}`)
        if (!result.success || !result.data) throw new Error(result.error || 'Nicht gefunden')
        setVacancy(result.data)
        setForm(toForm(result.data))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateVacancy(id, form)
      if (updated) {
        setVacancy(updated)
        setForm(toForm(updated))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!vacancy || !form) {
    return (
      <AdminPageWrapper title="Stelle nicht gefunden" icon={Briefcase} iconColor="green">
        <p className="text-text-secondary">{error ?? 'Die Stelle existiert nicht.'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push(ROUTES.admin.hrVacancies)}>
          Zur Liste
        </Button>
      </AdminPageWrapper>
    )
  }

  return (
    <AdminPageWrapper
      title={vacancy.title}
      description="Stelle bearbeiten und Status steuern"
      icon={Briefcase}
      iconColor="green"
      backButton={{ href: ROUTES.admin.hrVacancies, label: 'Zurück zur Liste' }}
    >
      {successMessage && (
        <div className="bg-action-muted border border-strong rounded-lg p-3 text-sm text-action">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-sm text-error-800">
          {error}
        </div>
      )}

      <VacancyCard
        vacancy={vacancy}
        actionLoading={actionLoading}
        onTransition={async (vid, status) => {
          await transitionStatus(vid, status)
          const result = await apiFetch<VacancyListItem>(`/api/admin/hr/vacancies/${id}`)
          if (result.success && result.data) {
            setVacancy(result.data)
            setForm(toForm(result.data))
          }
        }}
        onDuplicate={duplicateVacancy}
        onCopyLink={copyPublicLink}
        onShare={shareVacancy}
      />

      <div className="mt-8">
        <VacancyFormFields form={form} onChange={handleChange} showAdvanced={showAdvanced} />
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-action hover:underline mt-4 h-auto px-0"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? 'Erweitert ausblenden' : 'Erweitert anzeigen'}
        </Button>
        <div className="mt-4">
          <Button variant="primary" disabled={saving} onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
