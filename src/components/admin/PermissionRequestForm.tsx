'use client'

import { useTranslations } from 'next-intl'
import { Shield, Send, X, Check } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { useFormHandler } from '@/hooks/useFormHandler'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
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
  const t = useTranslations('admin.permissions.request')
  const tForms = useTranslations('admin.forms')
  const form = useFormHandler<PermissionRequestData>({
    initialData: { sections: [], reason: '' },
    apiEndpoint: '/api/admin/permissions/request',
    createSuccessMessage: t('successTitle'),
    validate: (data) => {
      if (data.sections.length === 0) {
        return t('validationNoSections')
      }
      if (data.reason.trim().length < 10) {
        return t('validationReasonTooShort')
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
      <div className="p-6 bg-action-muted border border-strong rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-action-muted rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-action" />
          </div>
          <div>
            <Heading level={3} className="font-semibold text-action-text">
              {t('successTitle')}
            </Heading>
            <p className="text-sm text-action">
              {t('successBody')}
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-sm text-action hover:text-action"
          >
            {tForms('close')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-action-muted rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-action" />
        </div>
        <div>
          <Heading level={3} className="font-semibold text-text-primary">
            {t('title')}
          </Heading>
          <p className="text-sm text-text-secondary">
            {t('subtitle')}
          </p>
        </div>
        {onClose && (
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="ml-auto text-text-tertiary hover:text-text-secondary"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Section Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">
          {t('sectionsLabel')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableSections.map(section => (
            <Button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              variant="ghost"
              className={`p-3 text-left rounded-lg border transition-colors ${
                form.data.sections.includes(section.id)
                  ? 'border-action bg-action-muted'
                  : 'border hover:border-strong'
              }`}
            >
              <span className="font-medium text-text-primary">
                {section.label}
              </span>
              <span className="block text-xs text-text-tertiary mt-1">
                {section.description}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <FormField label={t('reasonLabel')}>
        <Textarea
          value={form.data.reason}
          onChange={e => form.updateField('reason', e.target.value)}
          placeholder={t('reasonPlaceholder')}
          rows={3}
          aria-required="true"
          aria-invalid={!!form.error}
          aria-describedby={form.error ? 'permission-form-error' : undefined}
        />
      </FormField>

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
            {t('submitting')}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {t('submit')}
          </>
        )}
      </Button>
    </form>
  )
}
