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
      <div className="p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <Heading level={3} className="font-semibold text-primary-900 dark:text-primary-200">
              Anfrage gesendet
            </Heading>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Ein Super Admin wird deine Anfrage prüfen.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-primary-600 hover:text-primary-700"
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
        <div className="w-10 h-10 bg-info-100 dark:bg-info-900/30 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-info-600" />
        </div>
        <div>
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white">
            Zugriff anfordern
          </Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Wähle die Bereiche aus, auf die du Zugriff benötigst.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-neutral-500 hover:text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  ? 'border-info-500 bg-info-50 dark:bg-info-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <span className="font-medium text-neutral-900 dark:text-white">
                {section.label}
              </span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {section.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
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
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-info-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {form.error && (
        <div id="permission-form-error" className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-sm text-error-700 dark:text-error-300">{form.error}</p>
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
