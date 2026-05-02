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
    <div className={cn('bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Erste Schritte
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {steps.length - remaining}/{steps.length} erledigt
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
            )}
            {step.href && !step.done ? (
              <a href={step.href} className="text-neutral-600 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:underline">
                {step.label}
              </a>
            ) : (
              <span className={step.done ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-600 dark:text-neutral-400'}>
                {step.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
