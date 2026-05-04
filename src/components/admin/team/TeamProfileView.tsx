'use client'

/**
 * Team Profile View Component
 *
 * Read-only detail view of a team profile.
 * Shows all profile sections with appropriate visibility.
 */

import { useState } from 'react'
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  Target,
  Star,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import {
  getEmploymentTypeLabel,
  getEmploymentTypeColor,
  getDepartmentLabel,
  getDepartmentColor,
  CONTACT_METHOD_LABELS,
  EMERGENCY_RELATION_LABELS,
  type ContactMethod,
  type EmergencyRelation,
} from '@/config/team'
import { CurrentFocusInput } from './activity/CurrentFocusInput'
import { formatDateShort } from '@/lib/date-formats'
import type { TeamProfileViewProps } from './types'

export function TeamProfileView({
  profile,
  isSuperAdmin,
  onEdit,
  onBack,
}: TeamProfileViewProps) {
  const [currentFocus, setCurrentFocus] = useState(profile.current_focus)

  const initials = profile.user_name
    ? profile.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : profile.user_email[0].toUpperCase()

  const displayName = profile.user_name || profile.user_email.split('@')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zum Team
        </button>
        <Button
          onClick={onEdit}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Bearbeiten
        </Button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
            profile.is_active
              ? 'bg-gradient-to-r from-info-500 to-purple-600'
              : 'bg-neutral-400'
          }`}>
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading level={1} className="text-2xl text-neutral-900 dark:text-white">
                {displayName}
              </Heading>
              {!profile.is_active && (
                <span className="px-2 py-1 text-sm rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                  Inaktiv
                </span>
              )}
            </div>

            {profile.position && (
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-1">
                {profile.position}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {profile.department && (
                <span className={`px-3 py-1 text-sm rounded-full ${getDepartmentColor(profile.department)}`}>
                  {getDepartmentLabel(profile.department)}
                </span>
              )}
              {profile.employment_type && (
                <span className={`px-3 py-1 text-sm rounded-full ${getEmploymentTypeColor(profile.employment_type)}`}>
                  {getEmploymentTypeLabel(profile.employment_type)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {profile.user_email}
              </div>
              {profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </div>
              )}
              {profile.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Seit {formatDateShort(profile.start_date)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Focus & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Focus */}
        <CurrentFocusInput
          profileId={profile.id}
          initialFocus={currentFocus}
          onUpdate={setCurrentFocus}
        />

        {/* Activity Link */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              <Heading level={3} className="text-neutral-900 dark:text-neutral-100">Aktivitäten</Heading>
            </div>
            <Link
              href="/admin/team/activity"
              className="px-3 py-1.5 text-sm text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/30 rounded-lg"
            >
              Team-Aktivitäten ansehen
            </Link>
          </div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Erledigte Aufgaben, Meilensteine und Hilfsanfragen
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skills & Interests */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <Heading level={2} className="text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-500" />
              Fähigkeiten & Interessen
            </Heading>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  Fähigkeiten
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm mb-4">Keine Fähigkeiten erfasst</p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  Interessen
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Development Areas */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <Heading level={2} className="text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Entwicklung
            </Heading>

            {profile.goals && (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                  Ziele
                </Heading>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-pre-wrap">
                  {profile.goals}
                </p>
              </div>
            )}

            {profile.strengths && (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                  Stärken
                </Heading>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-pre-wrap">
                  {profile.strengths}
                </p>
              </div>
            )}

            {profile.development_areas && (
              <div>
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                  Entwicklungsbereiche
                </Heading>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-pre-wrap">
                  {profile.development_areas}
                </p>
              </div>
            )}

            {!profile.goals && !profile.strengths && !profile.development_areas && (
              <p className="text-neutral-400 text-sm">Keine Entwicklungsdaten erfasst</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <Heading level={2} className="text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-info-500" />
              Verfügbarkeit
            </Heading>

            <div className="space-y-3">
              {profile.working_hours && (
                <div>
                  <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300">
                    Arbeitszeiten
                  </Heading>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    {profile.working_hours}
                  </p>
                </div>
              )}

              {profile.contract_hours && (
                <div>
                  <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300">
                    Vertragsstunden
                  </Heading>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    {profile.contract_hours} Stunden/Woche
                  </p>
                </div>
              )}

              {profile.availability && (
                <div>
                  <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300">
                    Allgemeine Verfügbarkeit
                  </Heading>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-pre-wrap">
                    {profile.availability}
                  </p>
                </div>
              )}

              <div>
                <Heading level={3} className="text-sm text-neutral-700 dark:text-neutral-300">
                  Bevorzugte Kontaktart
                </Heading>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {CONTACT_METHOD_LABELS[profile.preferred_contact as ContactMethod] || profile.preferred_contact}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <Heading level={2} className="text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-error-500" />
                Notfallkontakt
              </Heading>

              <div className="space-y-2">
                {profile.emergency_contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {profile.emergency_contact_name}
                      {profile.emergency_contact_relation && (
                        <span className="text-neutral-400 ml-2">
                          ({EMERGENCY_RELATION_LABELS[profile.emergency_contact_relation as EmergencyRelation] || profile.emergency_contact_relation})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {profile.emergency_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {profile.emergency_contact_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HR Notes - Super Admin Only */}
          {isSuperAdmin && profile.hr_notes && (
            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800 p-6">
              <Heading level={2} className="text-warning-900 dark:text-warning-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                HR-Notizen (Vertraulich)
              </Heading>
              <p className="text-warning-800 dark:text-warning-300 text-sm whitespace-pre-wrap">
                {profile.hr_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-neutral-400 flex gap-4">
        <span>Erstellt: {formatDateShort(profile.created_at)}</span>
        <span>Aktualisiert: {formatDateShort(profile.updated_at)}</span>
      </div>
    </div>
  )
}
