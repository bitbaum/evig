'use client'

import { cn } from '@/lib/utils'
import { ROLES, type UserRole } from '@/lib/constants'
import type { OnboardingChecklistState } from '@/lib/domain/onboarding'
import { CheckCircle, Circle } from 'lucide-react'

interface Step {
  label: string
  done: boolean
  href?: string
}

interface OnboardingChecklistProps extends OnboardingChecklistState {
  role: UserRole
  /** Where the "complete your team profile" staff step links to. */
  teamProfileHref?: string
  className?: string
}

/** Shared card — renders the remaining steps, or nothing when all are done. */
function ChecklistCard({
  steps,
  title = 'Erste Schritte',
  className,
}: {
  steps: Step[]
  title?: string
  className?: string
}) {
  const allDone = steps.every((s) => s.done)
  if (allDone) return null
  const remaining = steps.filter((s) => !s.done).length

  return (
    <div className={cn('bg-surface-base rounded-lg border p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
        <span className="text-xs text-text-tertiary">
          {steps.length - remaining}/{steps.length} erledigt
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle className="w-4 h-4 text-action shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-text-muted dark:text-text-secondary shrink-0" />
            )}
            {step.href && !step.done ? (
              <a href={step.href} className="text-text-secondary hover:text-action hover:underline">
                {step.label}
              </a>
            ) : (
              <span className={step.done ? 'text-text-muted line-through' : 'text-text-secondary'}>
                {step.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OnboardingChecklist({
  role,
  emailVerified,
  profileComplete,
  sellerProfileSetup,
  hasListing,
  repairerProfileSetup,
  hasPublishedService,
  isStaff,
  scheduleSet,
  teamProfileComplete,
  teamProfileHref,
  className,
}: OnboardingChecklistProps) {
  // Staff get a DIFFERENT checklist: their profile drives Zeiterfassung
  // (schedule) and task-matching (skills/goals), so nudge those specifically.
  if (isStaff) {
    const staffSteps: Step[] = [
      { label: 'E-Mail-Adresse bestätigen', done: emailVerified, href: '/dashboard/profile' },
      { label: 'Arbeitsplan hinterlegen (für Zeiterfassung)', done: scheduleSet, href: '/admin/zeiterfassung' },
      { label: 'Team-Profil ausfüllen (Skills, Ziele)', done: teamProfileComplete, href: teamProfileHref },
    ]
    return <ChecklistCard steps={staffSteps} className={className} title="Willkommen im Team" />
  }

  const steps: Step[] = [
    { label: 'E-Mail-Adresse bestätigen', done: emailVerified, href: '/dashboard/profile' },
    { label: 'Profil vervollständigen', done: profileComplete, href: '/dashboard/profile' },
  ]

  if (role === ROLES.SELLER) {
    steps.push({
      label: 'Seller-Profil eingerichtet',
      done: sellerProfileSetup,
      href: '/dashboard/seller',
    })
    steps.push({
      label: 'Erstes Produkt inserieren',
      done: hasListing,
      href: '/dashboard/seller',
    })
  } else if (role === ROLES.REPAIRER) {
    steps.push({
      label: 'Techniker-Profil eingerichtet',
      done: repairerProfileSetup,
      href: '/dashboard/techniker',
    })
    steps.push({
      label: 'Erste Dienstleistung publizieren',
      done: hasPublishedService,
      href: '/dashboard/techniker',
    })
  }

  return <ChecklistCard steps={steps} className={className} />
}
