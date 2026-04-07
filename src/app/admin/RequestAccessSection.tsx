'use client'

import { useState } from 'react'
import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionRequestForm } from '@/components/admin/PermissionRequestForm'

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Weitere Bereiche verfügbar
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Es gibt {inaccessibleSections.length} Bereiche, auf die Sie keinen Zugriff haben.
              Sie können bei einem Super Admin Zugriff anfordern.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {inaccessibleSections.slice(0, 6).map(section => (
                <span
                  key={section.id}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg"
                >
                  {section.label}
                </span>
              ))}
              {inaccessibleSections.length > 6 && (
                <span className="px-3 py-1 text-gray-500 text-sm">
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
