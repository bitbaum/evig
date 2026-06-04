'use client'

import { cn } from '@/lib/utils'
import { UserRole, ROLES } from '@/lib/constants'
import { CheckCircle, Circle } from 'lucide-react'

interface Step {
  label: string
  done: boolean
  href?: string
}

interface OnboardingChecklistProps {
  role: UserRole
  emailVerified: boolean
  className?: string
}

export function OnboardingChecklist({ role, emailVerified, className }: OnboardingChecklistProps) {
  const steps: Step[] = [
    { label: 'E-Mail-Adresse bestätigen', done: emailVerified, href: '/dashboard/profile' },
    { label: 'Profil vervollständigen', done: false, href: '/dashboard/profile' },
  ]

  if (role === ROLES.SELLER) {
    steps.push({ label: 'Seller-Profil eingerichtet', done: true })
    steps.push({ label: 'Erstes Produkt inserieren', done: false, href: '/dashboard/seller' })
  } else if (role === ROLES.REPAIRER) {
    steps.push({ label: 'Techniker-Profil eingerichtet', done: true })
    steps.push({ label: 'Erste Dienstleistung publizieren', done: false, href: '/dashboard/repairer' })
  }

  const allDone = steps.every((s) => s.done)
  if (allDone) return null

  const remaining = steps.filter((s) => !s.done).length

  return (
    <div className={cn('bg-surface-base dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary">
          Erste Schritte
        </h2>
        <span className="text-xs text-text-tertiary">
          {steps.length - remaining}/{steps.length} erledigt
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
            )}
            {step.href && !step.done ? (
              <a href={step.href} className="text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
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
