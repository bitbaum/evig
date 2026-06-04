'use client'

import { useState } from 'react'
import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionRequestForm } from '@/components/admin/PermissionRequestForm'
import Heading from '@/components/admin/AdminHeading'

interface Section {
  id: string
  label: string
  description: string
}

interface RequestAccessSectionProps {
  inaccessibleSections: Section[]
}

export function RequestAccessSection({ inaccessibleSections }: RequestAccessSectionProps) {
  const [showForm, setShowForm] = useState(false)

  if (inaccessibleSections.length === 0) {
    return null
  }

  return (
    <div className="bg-surface-base rounded-xl shadow-sm border border-subtle dark:border-white/[0.06]">
      <div className="p-6 border-b border-subtle dark:border-white/[0.06]">
        <Heading level={2} className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-text-tertiary" />
          Weitere Bereiche verfügbar
        </Heading>
        <p className="text-sm text-text-secondary mt-1">
          Zugriff auf zusätzliche Admin-Bereiche anfordern
        </p>
      </div>

      <div className="p-6">
        {showForm ? (
          <PermissionRequestForm
            availableSections={inaccessibleSections}
            onClose={() => setShowForm(false)}
          />
        ) : (
          <div>
            <p className="text-sm text-text-secondary mb-4">
              Es gibt {inaccessibleSections.length} Bereiche, auf die du keinen Zugriff hast.
              Du kannst bei einem Super Admin Zugriff anfordern.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {inaccessibleSections.slice(0, 6).map(section => (
                <span
                  key={section.id}
                  className="px-3 py-1 bg-surface-raised dark:bg-neutral-700 text-text-secondary text-sm rounded-lg"
                >
                  {section.label}
                </span>
              ))}
              {inaccessibleSections.length > 6 && (
                <span className="px-3 py-1 text-text-tertiary text-sm">
                  +{inaccessibleSections.length - 6} mehr
                </span>
              )}
            </div>
            <Button onClick={() => setShowForm(true)} variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Zugriff anfordern
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
