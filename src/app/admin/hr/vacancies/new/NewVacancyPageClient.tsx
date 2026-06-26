'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { ROLE_TRACKS } from '@/config/hr-vacancies'
import { VacancyFormFields, useHrVacancies } from '@/components/admin/hr'
import type { VacancyFormData } from '@/components/admin/hr/types'

const emptyForm: VacancyFormData = {
  title: '',
  summary: '',
  description: '',
  role_track: ROLE_TRACKS.VOLUNTEER,
  department: '',
  location: '',
  remote_ok: false,
  hours_per_week: '',
  start_date: '',
  application_deadline: '',
  compensation_public_text: '',
  show_on_get_involved: true,
  seo_title: '',
  seo_description: '',
}

export default function NewVacancyPageClient() {
  const router = useRouter()
  const { createVacancy } = useHrVacancies()
  const [form, setForm] = useState<VacancyFormData>(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (publish: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createVacancy(form, publish)
      if (created?.id) {
        router.push(ROUTES.admin.hrVacancy(created.id))
      } else {
        router.push(ROUTES.admin.hrVacancies)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageWrapper
      title="Neue Stelle"
      description="Minimale Angaben reichen — Details kannst du später ergänzen"
      icon={Briefcase}
      iconColor="green"
      backButton={{ href: ROUTES.admin.hrVacancies, label: 'Zurück zur Liste' }}
    >
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-sm text-error-800 mb-4">
          {error}
        </div>
      )}

      <VacancyFormFields form={form} onChange={handleChange} showAdvanced={showAdvanced} />

      <Button
        type="button"
        variant="ghost"
        className="text-sm text-action hover:underline mt-4 h-auto px-0"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? 'Erweitert ausblenden' : 'Erweitert anzeigen (SEO, Vergütung)'}
      </Button>

      <div className="flex flex-wrap gap-2 mt-6">
        <Button variant="secondary" disabled={saving} onClick={() => handleSubmit(false)}>
          Als Entwurf speichern
        </Button>
        <Button variant="primary" disabled={saving} onClick={() => handleSubmit(true)}>
          Veröffentlichen
        </Button>
      </div>
    </AdminPageWrapper>
  )
}
