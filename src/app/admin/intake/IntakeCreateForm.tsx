'use client'

import { useTranslations } from 'next-intl'
import {
  X, ChevronDown, ChevronRight,
  AlertCircle, Type, Mic, Camera, Loader2,
} from 'lucide-react'
import { INTAKE_TIERS, getIntakeTierOptions } from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { ImageCapture } from '@/components/erfassung/ImageCapture'
import type { CreateFormData } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

interface IntakeCreateFormProps {
  formData: CreateFormData
  setFormData: React.Dispatch<React.SetStateAction<CreateFormData>>
  saving: boolean
  aiTab: 'text' | 'voice' | 'photo'
  setAiTab: (tab: 'text' | 'voice' | 'photo') => void
  aiText: string
  setAiText: (text: string) => void
  aiLoading: boolean
  aiError: string | null
  aiOpen: boolean
  setAiOpen: (open: boolean) => void
  voiceState: 'idle' | 'recording' | 'processing'
  onAiTextExtract: () => void
  onStartVoiceRecording: () => void
  onStopVoiceRecording: () => void
  onPhotoAnalysis: (data: Record<string, unknown>) => void
  onCreate: () => void
  onCancel: () => void
}

export function IntakeCreateForm({
  formData,
  setFormData,
  saving,
  aiTab,
  setAiTab,
  aiText,
  setAiText,
  aiLoading,
  aiError,
  aiOpen,
  setAiOpen,
  voiceState,
  onAiTextExtract,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onPhotoAnalysis,
  onCreate,
  onCancel,
}: IntakeCreateFormProps) {
  const t = useTranslations('admin.intake.createForm')
  const tForms = useTranslations('admin.forms')
  const tierOptions = getIntakeTierOptions()
  const selectedCategory = KATEGORIEN.find(k => k.value === formData.hauptkategorie)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={2} className="text-lg font-semibold">{t('title')}</Heading>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-text-tertiary hover:text-text-secondary">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tier Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('tierLabel')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tierOptions.map(opt => (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              onClick={() => setFormData(f => ({ ...f, intake_tier: opt.value }))}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                formData.intake_tier === opt.value
                  ? 'border-action bg-action-muted'
                  : 'border hover:border-strong'
              }`}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-text-tertiary">{opt.description}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* AI Quick Input */}
      <div className="border rounded-lg overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setAiOpen(!aiOpen)}
          className="w-full flex items-center justify-between p-3 bg-action-muted hover:bg-action-muted text-left"
        >
          <span className="text-sm font-medium text-action flex items-center gap-2">
            <Loader2 className="w-4 h-4" />
            {t('aiTitle')}
          </span>
          {aiOpen ? <ChevronDown className="w-4 h-4 text-action" /> : <ChevronRight className="w-4 h-4 text-action" />}
        </Button>

        {aiOpen && (
          <div className="p-4 space-y-3 bg-surface-base">
            {/* Tabs */}
            <div className="flex gap-1 border-b">
              {([
                { key: 'text' as const, icon: Type, label: t('aiTabs.text') },
                { key: 'voice' as const, icon: Mic, label: t('aiTabs.voice') },
                { key: 'photo' as const, icon: Camera, label: t('aiTabs.photo') },
              ]).map(tab => (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                    aiTab === tab.key
                      ? 'border-action text-action font-medium'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Text Tab */}
            {aiTab === 'text' && (
              <div className="space-y-2">
                <Textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder={t('textPlaceholder')}
                  rows={3}
                />
                <Button
                  type="button"
                  onClick={onAiTextExtract}
                  disabled={aiLoading || aiText.trim().length < 3}
                  variant="primary"
                  size="sm"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
                  {t('analyze')}
                </Button>
              </div>
            )}

            {/* Voice Tab */}
            {aiTab === 'voice' && (
              <div className="space-y-2">
                {voiceState === 'idle' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onStartVoiceRecording}
                    className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-default rounded-lg hover:border-action w-full justify-center text-sm text-text-secondary"
                  >
                    <Mic className="w-5 h-5" />
                    {t('startRecording')}
                  </Button>
                )}
                {voiceState === 'recording' && (
                  <Button
                    type="button"
                    variant="destructive-outline"
                    onClick={onStopVoiceRecording}
                    className="flex items-center gap-2 px-4 py-3 bg-error-50 dark:bg-error-900/20 border-2 border-error-300 rounded-lg w-full justify-center text-sm text-error-700 dark:text-error-400 animate-pulse"
                  >
                    <Mic className="w-5 h-5" />
                    {t('stopRecording')}
                  </Button>
                )}
                {voiceState === 'processing' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-action-muted rounded-lg justify-center text-sm text-action">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('processingVoice')}
                  </div>
                )}
                {aiText && voiceState === 'idle' && (
                  <p className="text-xs text-text-tertiary bg-surface-raised p-2 rounded-sm">{t('transcription', { text: aiText })}</p>
                )}
              </div>
            )}

            {/* Photo Tab */}
            {aiTab === 'photo' && (
              <ImageCapture
                onImageCapture={(base64) => setFormData(f => ({ ...f, image: base64 }))}
                onAnalysisComplete={(data) => onPhotoAnalysis(data as Record<string, unknown>)}
              />
            )}

            {/* Error */}
            {aiError && (
              <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-2 rounded-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {aiError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('fields.manufacturer')} required>
          <Input
            type="text"
            value={formData.hersteller}
            onChange={(e) => setFormData(f => ({ ...f, hersteller: e.target.value }))}
            placeholder={t('fields.manufacturerPlaceholder')}
          />
        </FormField>
        <FormField label={t('fields.productName')} required>
          <Input
            type="text"
            value={formData.produktname}
            onChange={(e) => setFormData(f => ({ ...f, produktname: e.target.value }))}
            placeholder={t('fields.productNamePlaceholder')}
          />
        </FormField>
      </div>

      <FormField label={t('fields.shortDescription')}>
        <Textarea
          value={formData.kurzbeschreibung}
          onChange={(e) => setFormData(f => ({ ...f, kurzbeschreibung: e.target.value }))}
          placeholder={t('fields.shortDescriptionPlaceholder')}
          rows={2}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label={t('fields.category')}>
          <Select
            value={formData.hauptkategorie}
            onChange={(e) => setFormData(f => ({ ...f, hauptkategorie: e.target.value, unterkategorie: '' }))}
          >
            <option value="">{t('fields.choose')}</option>
            {KATEGORIEN.map(k => (
              <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={t('fields.subcategory')}>
          <Select
            value={formData.unterkategorie}
            onChange={(e) => setFormData(f => ({ ...f, unterkategorie: e.target.value }))}
            disabled={!selectedCategory}
          >
            <option value="">{t('fields.choose')}</option>
            {selectedCategory?.subs.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={t('fields.condition')} required>
          <Select
            value={formData.zustand}
            onChange={(e) => setFormData(f => ({ ...f, zustand: e.target.value }))}
          >
            {ZUSTAND_OPTIONS.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {formData.intake_tier === INTAKE_TIERS.REFURBISH && (
        <FormField label={t('fields.salesPrice')}>
          <Input
            type="number"
            value={formData.verkaufspreis || ''}
            onChange={(e) => setFormData(f => ({ ...f, verkaufspreis: Number(e.target.value) }))}
            placeholder="0"
            min={0}
          />
        </FormField>
      )}

      {/* Donation Toggle */}
      <div className="border rounded-lg p-4 bg-action-muted">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_donation}
            onChange={(e) => setFormData(f => ({ ...f, is_donation: e.target.checked }))}
            className="rounded-sm"
          />
          <span className="text-sm font-medium">{t('donation.isDonation')}</span>
        </label>

        {formData.is_donation && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('donation.donorName')}>
              <Input
                type="text"
                value={formData.donor_name}
                onChange={(e) => setFormData(f => ({ ...f, donor_name: e.target.value }))}
                placeholder={t('donation.optional')}
              />
            </FormField>
            <FormField label={t('donation.donorEmail')}>
              <Input
                type="email"
                value={formData.donor_email}
                onChange={(e) => setFormData(f => ({ ...f, donor_email: e.target.value }))}
                placeholder={t('donation.optional')}
              />
            </FormField>
            <div className="col-span-2">
              <FormField label={t('donation.donorNotes')}>
                <Input
                  type="text"
                  value={formData.donor_notes}
                  onChange={(e) => setFormData(f => ({ ...f, donor_notes: e.target.value }))}
                  placeholder={t('donation.notesPlaceholder')}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          onClick={onCreate}
          disabled={saving || !formData.hersteller || !formData.produktname}
          variant="primary"
          size="sm"
        >
          {saving ? t('saving') : t('submit')}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          {tForms('cancel')}
        </Button>
      </div>
    </div>
  )
}
