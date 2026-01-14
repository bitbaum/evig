'use client'

import React from 'react'
import { RoleSelector } from '../RoleSelector'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getButtonVariant } from '@/lib/design-system'

interface RoleStepProps {
  selectedRole: string
  onRoleChange: (role: string) => void
  onNext: () => void
}

export function RoleStep({ selectedRole, onRoleChange, onNext }: RoleStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Wie möchten Sie RevampIT nutzen?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Wählen Sie eine Rolle, die am besten zu Ihnen passt
        </p>
      </div>

      <RoleSelector
        selectedRole={selectedRole}
        onRoleChange={onRoleChange}
        variant="default"
      />

      <button
        type="button"
        onClick={onNext}
        disabled={!selectedRole}
        className={cn(
          'w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          getButtonVariant('primary').bg,
          getButtonVariant('primary').text,
          getButtonVariant('primary').hover
        )}
      >
        <span>Weiter</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
