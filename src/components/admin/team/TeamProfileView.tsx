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
import { useTranslations } from 'next-intl'
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
import { ROUTES } from '@/config/routes'

export function TeamProfileView({
  profile,
  isSuperAdmin,
  onBack,
}: TeamProfileViewProps) {
  const [currentFocus, setCurrentFocus] = useState(profile.current_focus)
  const t = useTranslations('admin.team')

  const initials = profile.user_name
    ? profile.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : profile.user_email[0].toUpperCase()

  const displayName = profile.user_name || profile.user_email.split('@')[0]

  return (
    <div className="space-y-6">
      {/* Header — the "Bearbeiten" action lives on the TeamProfileTabs strip
          above this view (always visible across tabs). Showing a second one
          inside the overview tab was redundant; only the back link stays. */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('backToTeam')}
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface-base rounded-xl border border p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 ${
            profile.is_active
              ? 'bg-action'
              : 'bg-surface-overlay'
          }`}>
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading level={1} className="text-2xl text-text-primary">
                {displayName}
              </Heading>
              {!profile.is_active && (
                <span className="px-2 py-1 text-sm rounded-sm bg-surface-overlay text-text-secondary">
                  {t('inactive')}
                </span>
              )}
            </div>

            {profile.position && (
              <p className="text-lg text-text-secondary mt-1">
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

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-tertiary">
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
                  {t('since')} {formatDateShort(profile.start_date)}
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
        <div className="bg-surface-base rounded-xl border border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-action" />
              <Heading level={3} className="text-text-primary">{t('activities')}</Heading>
            </div>
            <Link
              href={ROUTES.admin.teamActivity}
              className="px-3 py-1.5 text-sm text-action hover:bg-action-muted-muted rounded-lg"
            >
              {t('viewTeamActivities')}
            </Link>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {t('activitiesDescription')}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skills & Interests */}
          <div className="bg-surface-base rounded-xl border border p-6">
            <Heading level={2} className="text-text-primary mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-500" />
              {t('skillsAndInterests')}
            </Heading>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-text-secondary mb-2">
                  {t('skills')}
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-action-muted-muted text-action text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-text-muted text-sm mb-4">{t('noSkills')}</p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <Heading level={3} className="text-sm text-text-secondary mb-2">
                  {t('interests')}
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-action-muted-muted text-action text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Development Areas */}
          <div className="bg-surface-base rounded-xl border border p-6">
            <Heading level={2} className="text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-action" />
              {t('development')}
            </Heading>

            {profile.goals && (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-text-secondary mb-1">
                  {t('goals')}
                </Heading>
                <p className="text-text-secondary text-sm whitespace-pre-wrap">
                  {profile.goals}
                </p>
              </div>
            )}

            {profile.strengths && (
              <div className="mb-4">
                <Heading level={3} className="text-sm text-text-secondary mb-1">
                  {t('strengths')}
                </Heading>
                <p className="text-text-secondary text-sm whitespace-pre-wrap">
                  {profile.strengths}
                </p>
              </div>
            )}

            {profile.development_areas && (
              <div>
                <Heading level={3} className="text-sm text-text-secondary mb-1">
                  {t('developmentAreas')}
                </Heading>
                <p className="text-text-secondary text-sm whitespace-pre-wrap">
                  {profile.development_areas}
                </p>
              </div>
            )}

            {!profile.goals && !profile.strengths && !profile.development_areas && (
              <p className="text-text-muted text-sm">{t('noDevelopmentData')}</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-surface-base rounded-xl border border p-6">
            <Heading level={2} className="text-text-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-action" />
              {t('availability')}
            </Heading>

            <div className="space-y-3">
              {profile.working_hours && (
                <div>
                  <Heading level={3} className="text-sm text-text-secondary">
                    {t('workingHours')}
                  </Heading>
                  <p className="text-text-secondary text-sm">
                    {profile.working_hours}
                  </p>
                </div>
              )}

              {profile.contract_hours && (
                <div>
                  <Heading level={3} className="text-sm text-text-secondary">
                    {t('contractHours')}
                  </Heading>
                  <p className="text-text-secondary text-sm">
                    {profile.contract_hours} {t('hoursPerWeek')}
                  </p>
                </div>
              )}

              {profile.availability && (
                <div>
                  <Heading level={3} className="text-sm text-text-secondary">
                    {t('generalAvailability')}
                  </Heading>
                  <p className="text-text-secondary text-sm whitespace-pre-wrap">
                    {profile.availability}
                  </p>
                </div>
              )}

              <div>
                <Heading level={3} className="text-sm text-text-secondary">
                  {t('preferredContact')}
                </Heading>
                <p className="text-text-secondary text-sm">
                  {CONTACT_METHOD_LABELS[profile.preferred_contact as ContactMethod] || profile.preferred_contact}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
            <div className="bg-surface-base rounded-xl border border p-6">
              <Heading level={2} className="text-text-primary mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-error-500" />
                {t('emergencyContact')}
              </Heading>

              <div className="space-y-2">
                {profile.emergency_contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-text-secondary">
                      {profile.emergency_contact_name}
                      {profile.emergency_contact_relation && (
                        <span className="text-text-muted ml-2">
                          ({EMERGENCY_RELATION_LABELS[profile.emergency_contact_relation as EmergencyRelation] || profile.emergency_contact_relation})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {profile.emergency_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <span className="text-text-secondary">
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
                {t('hrNotes')}
              </Heading>
              <p className="text-warning-800 dark:text-warning-300 text-sm whitespace-pre-wrap">
                {profile.hr_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-text-muted flex gap-4">
        <span>{t('createdAt')}: {formatDateShort(profile.created_at)}</span>
        <span>{t('updatedAt')}: {formatDateShort(profile.updated_at)}</span>
      </div>
    </div>
  )
}
