'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import {
  HR_APPLY_FOOTER,
  HR_TRACK_DISCLAIMERS,
  type RoleTrack,
} from '@/config/hr-vacancies'
import { ROUTES } from '@/config/routes'
import { Link } from '@/i18n/navigation'

interface Props {
  slug: string
  roleTrack: RoleTrack
  acceptsApplications: boolean
}

export function CareerApplyForm({ slug, roleTrack, acceptsApplications }: Props) {
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cvStorageKey, setCvStorageKey] = useState<string | null>(null)
  const [cvUploading, setCvUploading] = useState(false)

  const [applicant, setApplicant] = useState({
    name: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    phone: '',
  })

  const [track, setTrack] = useState<Record<string, string | boolean>>({
    motivation: '',
    availability: '',
    skills: '',
    start_date_preference: '',
    hours_per_week: '',
    school_program: '',
    duration: '',
    learning_goals: '',
    experience_summary: '',
    notice_period: '',
    work_permit: false,
    work_permit_detail: '',
    salary_expectation: '',
    cv_url: '',
    situation: '',
    support_needs: '',
    portfolio_url: '',
    rate_range: '',
    project_interest: '',
  })

  const setField = (key: string, value: string | boolean) => {
    setTrack((prev) => ({ ...prev, [key]: value }))
  }

  const handleCvUpload = async (file: File | null) => {
    if (!file) return
    setCvUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/careers/upload-cv', { method: 'POST', body: fd })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Upload fehlgeschlagen')
      setCvStorageKey(body.data.storage_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setCvUploading(false)
    }
  }

  const buildTrackResponses = (): Record<string, unknown> => {
    const skills = track.skills
      ? String(track.skills).split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const base = {
      motivation: track.motivation,
      availability: track.availability || undefined,
      skills,
      start_date_preference: track.start_date_preference || undefined,
    }

    switch (roleTrack) {
      case 'volunteer':
        return {
          ...base,
          hours_per_week: track.hours_per_week ? parseInt(String(track.hours_per_week), 10) : undefined,
        }
      case 'intern':
        return {
          ...base,
          school_program: track.school_program,
          duration: track.duration,
          learning_goals: track.learning_goals,
        }
      case 'employee':
        return {
          ...base,
          experience_summary: track.experience_summary,
          notice_period: track.notice_period || undefined,
          work_permit: track.work_permit,
          work_permit_detail: track.work_permit_detail || undefined,
          salary_expectation: track.salary_expectation || undefined,
          cv_url: track.cv_url || undefined,
        }
      case 'reintegration':
        return {
          ...base,
          situation: track.situation,
          support_needs: track.support_needs || undefined,
        }
      case 'contractor':
        return {
          ...base,
          portfolio_url: track.portfolio_url || undefined,
          rate_range: track.rate_range || undefined,
          project_interest: track.project_interest,
        }
      default:
        return base
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptsApplications) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/careers/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: applicant.name,
          applicant_email: applicant.email,
          applicant_phone: applicant.phone || undefined,
          source: 'website',
          track_responses: buildTrackResponses(),
          cv_storage_key: cvStorageKey ?? undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Bewerbung fehlgeschlagen')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bewerbung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  if (!acceptsApplications) {
    return (
      <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
        Bewerbungen sind derzeit pausiert. Schau später wieder vorbei oder{' '}
        <Link href="/get-involved/kontakt" className="underline">kontaktiere uns</Link>.
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-lg border border-strong bg-action-muted p-6 text-center">
        <p className="font-semibold text-action">Danke für deine Bewerbung!</p>
        <p className="text-sm text-text-secondary mt-2">Wir melden uns bei dir per E-Mail.</p>
        <Link href={ROUTES.public.careers} className="inline-block mt-4 text-sm text-action underline">
          Weitere Stellen ansehen
        </Link>
      </div>
    )
  }

  const disclaimer = HR_TRACK_DISCLAIMERS[roleTrack]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {disclaimer && (
        <p className="text-sm text-text-muted border-l-2 border-primary-500 pl-3">{disclaimer}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Name *" htmlFor="name">
          <Input
            id="name"
            required
            value={applicant.name}
            onChange={(e) => setApplicant((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>
        <FormField label="E-Mail *" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={applicant.email}
            onChange={(e) => setApplicant((p) => ({ ...p, email: e.target.value }))}
          />
        </FormField>
      </div>

      <FormField label="Telefon (optional)" htmlFor="phone">
        <Input
          id="phone"
          value={applicant.phone}
          onChange={(e) => setApplicant((p) => ({ ...p, phone: e.target.value }))}
        />
      </FormField>

      <FormField label="Motivation *" htmlFor="motivation">
        <Textarea
          id="motivation"
          required
          minLength={20}
          rows={5}
          value={String(track.motivation)}
          onChange={(e) => setField('motivation', e.target.value)}
        />
      </FormField>

      {roleTrack === 'volunteer' && (
        <>
          <FormField label="Verfügbare Stunden pro Woche" htmlFor="hours_per_week">
            <Input
              id="hours_per_week"
              type="number"
              min={1}
              max={40}
              value={String(track.hours_per_week)}
              onChange={(e) => setField('hours_per_week', e.target.value)}
            />
          </FormField>
        </>
      )}

      {roleTrack === 'intern' && (
        <>
          <FormField label="Schule / Programm *" htmlFor="school_program">
            <Input
              id="school_program"
              required
              value={String(track.school_program)}
              onChange={(e) => setField('school_program', e.target.value)}
            />
          </FormField>
          <FormField label="Dauer *" htmlFor="duration">
            <Input
              id="duration"
              required
              value={String(track.duration)}
              onChange={(e) => setField('duration', e.target.value)}
            />
          </FormField>
          <FormField label="Lernziele *" htmlFor="learning_goals">
            <Textarea
              id="learning_goals"
              required
              rows={4}
              value={String(track.learning_goals)}
              onChange={(e) => setField('learning_goals', e.target.value)}
            />
          </FormField>
        </>
      )}

      {roleTrack === 'employee' && (
        <>
          <FormField label="Berufserfahrung *" htmlFor="experience_summary">
            <Textarea
              id="experience_summary"
              required
              rows={4}
              value={String(track.experience_summary)}
              onChange={(e) => setField('experience_summary', e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(track.work_permit)}
              onChange={(e) => setField('work_permit', e.target.checked)}
            />
            Arbeitsbewilligung vorhanden
          </label>
          {!track.work_permit && (
            <FormField label="Details zur Bewilligung" htmlFor="work_permit_detail">
              <Input
                id="work_permit_detail"
                value={String(track.work_permit_detail)}
                onChange={(e) => setField('work_permit_detail', e.target.value)}
              />
            </FormField>
          )}
          <FormField label="Lebenslauf (PDF)" htmlFor="cv">
            <Input
              id="cv"
              type="file"
              accept="application/pdf"
              disabled={cvUploading}
              onChange={(e) => handleCvUpload(e.target.files?.[0] ?? null)}
            />
            {cvStorageKey && <p className="text-xs text-primary-600 mt-1">CV hochgeladen</p>}
          </FormField>
        </>
      )}

      {roleTrack === 'reintegration' && (
        <>
          <FormField label="Deine Situation *" htmlFor="situation">
            <Textarea
              id="situation"
              required
              rows={4}
              value={String(track.situation)}
              onChange={(e) => setField('situation', e.target.value)}
            />
          </FormField>
          <FormField label="Unterstützungsbedarf (optional)" htmlFor="support_needs">
            <Textarea
              id="support_needs"
              rows={3}
              value={String(track.support_needs)}
              onChange={(e) => setField('support_needs', e.target.value)}
            />
          </FormField>
        </>
      )}

      {roleTrack === 'contractor' && (
        <>
          <FormField label="Portfolio-URL" htmlFor="portfolio_url">
            <Input
              id="portfolio_url"
              type="url"
              value={String(track.portfolio_url)}
              onChange={(e) => setField('portfolio_url', e.target.value)}
            />
          </FormField>
          <FormField label="Projektinteresse *" htmlFor="project_interest">
            <Textarea
              id="project_interest"
              required
              rows={4}
              value={String(track.project_interest)}
              onChange={(e) => setField('project_interest', e.target.value)}
            />
          </FormField>
        </>
      )}

      <FormField label="Skills (kommagetrennt)" htmlFor="skills">
        <Input
          id="skills"
          placeholder="Linux, Hardware, Kommunikation"
          value={String(track.skills)}
          onChange={(e) => setField('skills', e.target.value)}
        />
      </FormField>

      {error && <p className="text-sm text-error-700">{error}</p>}

      <p className="text-xs text-text-muted">{HR_APPLY_FOOTER}</p>

      <Button type="submit" variant="primary" disabled={submitting || cvUploading}>
        {submitting ? 'Wird gesendet…' : 'Bewerbung absenden'}
      </Button>
    </form>
  )
}
