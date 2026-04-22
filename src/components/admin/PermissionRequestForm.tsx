'use client'

import { Shield, Send, X, Check } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { useFormHandler } from '@/hooks/useFormHandler'
import { Button } from '@/components/ui/button'

interface Section {
  id: string
  label: string
  description: string
}

interface PermissionRequestFormProps {
  availableSections: Section[]
  onClose?: () => void
}

interface PermissionRequestData {
  sections: string[]
  reason: string
}

export function PermissionRequestForm({ availableSections, onClose }: PermissionRequestFormProps) {
  const form = useFormHandler<PermissionRequestData>({
    initialData: { sections: [], reason: '' },
    apiEndpoint: '/api/admin/permissions/request',
    createSuccessMessage: 'Anfrage gesendet',
    validate: (data) => {
      if (data.sections.length === 0) {
        return 'Bitte wähle mindestens einen Bereich aus.'
      }
      if (data.reason.trim().length < 10) {
        return 'Bitte gib einen Grund an (mindestens 10 Zeichen).'
      }
      return null
    },
    transformBeforeSubmit: (data) => ({
      sections: data.sections,
      reason: data.reason.trim(),
    }),
  })

  const toggleSection = (sectionId: string) => {
    form.setData(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId],
    }))
  }

  if (form.success) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <Heading level={3} className="font-semibold text-green-900 dark:text-green-200">
              Anfrage gesendet
            </Heading>
            <p className="text-sm text-green-700 dark:text-green-300">
              Ein Super Admin wird deine Anfrage prüfen.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Schliessen
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <Heading level={3} className="font-semibold text-gray-900 dark:text-white">
            Zugriff anfordern
          </Heading>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Wähle die Bereiche aus, auf die du Zugriff benötigst.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bereiche auswählen
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableSections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`p-3 text-left rounded-lg border transition-colors ${
                form.data.sections.includes(section.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {section.label}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {section.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Begründung
        </label>
        <textarea
          value={form.data.reason}
          onChange={e => form.updateField('reason', e.target.value)}
          placeholder="Warum benötigst du Zugriff auf diese Bereiche?"
          rows={3}
          aria-required="true"
          aria-invalid={!!form.error}
          aria-describedby={form.error ? 'permission-form-error' : undefined}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {form.error && (
        <div id="permission-form-error" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{form.error}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={form.isSubmitting || form.data.sections.length === 0}
        variant="primary"
        className="w-full flex items-center justify-center gap-2 px-4 py-3"
      >
        {form.isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Wird gesendet...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Anfrage senden
          </>
        )}
      </Button>
    </form>
  )
}
