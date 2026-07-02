'use client'

/**
 * BulkDetailPanel Component
 *
 * Slide-in panel for editing a single product in bulk mode.
 * Renders ProductForm with the selected product's data.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/erfassung/ProductForm'
import type { BulkProduct, ErfassungFormData } from '@/types/erfassung'
import Heading from '@/components/ui/Heading'
import { SPEC_TEMPLATES, templateToSpecFields } from '@/config/erfassung'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface BulkDetailPanelProps {
  product: BulkProduct
  onUpdate: (updates: Partial<BulkProduct>) => void
  onClose: () => void
}

export function BulkDetailPanel({ product, onUpdate, onClose }: BulkDetailPanelProps) {
  const t = useTranslations('components.erfassung.bulkDetail')
  const [localData, setLocalData] = useState<BulkProduct>({ ...product })
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Escape-to-close, initial focus, focus restore and the Tab trap all live in
  // the shared hook; attach its ref to the panel below.
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose)

  const handleFieldChange = (field: keyof ErfassungFormData, value: string | string[]) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (kategorie: string) => {
    setLocalData(prev => ({
      ...prev,
      hauptkategorie: kategorie,
      unterkategorie: '',
      specs: templateToSpecFields(SPEC_TEMPLATES[kategorie] || SPEC_TEMPLATES.default),
    }))
  }

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...localData.specs]
    newSpecs[index] = { ...newSpecs[index], [field]: value }
    setLocalData(prev => ({ ...prev, specs: newSpecs }))
  }

  const handleSpecAdd = () => {
    setLocalData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', value: '' }]
    }))
  }

  const handleSpecRemove = (index: number) => {
    if (localData.specs.length > 1) {
      setLocalData(prev => ({
        ...prev,
        specs: prev.specs.filter((_, i) => i !== index)
      }))
    }
  }

  const handleProfileToggle = (slug: string) => {
    setLocalData(prev => ({
      ...prev,
      kundenprofile: prev.kundenprofile.includes(slug)
        ? prev.kundenprofile.filter(p => p !== slug)
        : [...prev.kundenprofile, slug]
    }))
  }

  const handleApply = () => {
    const hasRequired = localData.hersteller && localData.produktname
    const status = hasRequired ? 'valid' : 'warning'

    onUpdate({
      ...localData,
      _status: status,
      _errors: hasRequired ? [] : [t('validationError')],
    })
    onClose()
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel — tabIndex=-1 so the trap can focus it when no child is focusable. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${localData.hersteller || 'Produkt'} ${localData.produktname || t('editLabel')}`}
        className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-surface-base z-50 shadow-xs overflow-y-auto focus:outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-base border-b border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <Heading level={3} className="font-semibold text-text-primary">
              {localData.hersteller || 'Produkt'} {localData.produktname || t('editLabel')}
            </Heading>
            <p className="text-xs text-text-tertiary">
              {t('sourcePrefix')}{localData._source}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-lg hover:bg-surface-raised"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Errors */}
          {localData._errors.length > 0 && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
              {localData._errors.map((err, i) => (
                <p key={i} className="text-sm text-error-700 dark:text-error-300">{err}</p>
              ))}
            </div>
          )}

          <ProductForm
            formData={localData}
            aiMetadata={localData._aiMetadata || {}}
            showAdvanced={showAdvanced}
            isEditMode={false}
            onFieldChange={handleFieldChange}
            onSpecChange={handleSpecChange}
            onCategoryChange={handleCategoryChange}
            onProfileToggle={handleProfileToggle}
            onSpecAdd={handleSpecAdd}
            onSpecRemove={handleSpecRemove}
            onImageChange={(image) => setLocalData(prev => ({ ...prev, image }))}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />
        </div>

        {/* Footer with apply button */}
        <div className="sticky bottom-0 bg-surface-base border-t border px-4 py-3 flex gap-3">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1 py-2.5">
            {t('close')}
          </Button>
          <Button type="button" onClick={handleApply} className="flex-1 py-2.5">
            {t('apply')}
          </Button>
        </div>
      </div>
    </>
  )
}
