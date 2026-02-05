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
import Link from 'next/link'
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
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zum Team
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Bearbeiten
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
            profile.is_active
              ? 'bg-gradient-to-r from-blue-500 to-purple-600'
              : 'bg-gray-400'
          }`}>
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}
              </h1>
              {!profile.is_active && (
                <span className="px-2 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  Inaktiv
                </span>
              )}
            </div>

            {profile.position && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
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

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
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
                  Seit {new Date(profile.start_date).toLocaleDateString('de-CH')}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Aktivitäten</h3>
            </div>
            <Link
              href="/admin/team/activity"
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
            >
              Team-Aktivitäten ansehen
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Erledigte Aufgaben, Meilensteine und Hilfsanfragen
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skills & Interests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Fähigkeiten & Interessen
            </h2>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fähigkeiten
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-4">Keine Fähigkeiten erfasst</p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interessen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Development Areas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Entwicklung
            </h2>

            {profile.goals && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ziele
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                  {profile.goals}
                </p>
              </div>
            )}

            {profile.strengths && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stärken
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                  {profile.strengths}
                </p>
              </div>
            )}

            {profile.development_areas && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Entwicklungsbereiche
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                  {profile.development_areas}
                </p>
              </div>
            )}

            {!profile.goals && !profile.strengths && !profile.development_areas && (
              <p className="text-gray-400 text-sm">Keine Entwicklungsdaten erfasst</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Verfügbarkeit
            </h2>

            <div className="space-y-3">
              {profile.working_hours && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arbeitszeiten
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {profile.working_hours}
                  </p>
                </div>
              )}

              {profile.contract_hours && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vertragsstunden
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {profile.contract_hours} Stunden/Woche
                  </p>
                </div>
              )}

              {profile.availability && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allgemeine Verfügbarkeit
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                    {profile.availability}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bevorzugte Kontaktart
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {CONTACT_METHOD_LABELS[profile.preferred_contact as ContactMethod] || profile.preferred_contact}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Notfallkontakt
              </h2>

              <div className="space-y-2">
                {profile.emergency_contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {profile.emergency_contact_name}
                      {profile.emergency_contact_relation && (
                        <span className="text-gray-400 ml-2">
                          ({EMERGENCY_RELATION_LABELS[profile.emergency_contact_relation as EmergencyRelation] || profile.emergency_contact_relation})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {profile.emergency_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {profile.emergency_contact_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HR Notes - Super Admin Only */}
          {isSuperAdmin && profile.hr_notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
              <h2 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                HR-Notizen (Vertraulich)
              </h2>
              <p className="text-yellow-800 dark:text-yellow-300 text-sm whitespace-pre-wrap">
                {profile.hr_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-400 flex gap-4">
        <span>Erstellt: {new Date(profile.created_at).toLocaleDateString('de-CH')}</span>
        <span>Aktualisiert: {new Date(profile.updated_at).toLocaleDateString('de-CH')}</span>
      </div>
    </div>
  )
}
