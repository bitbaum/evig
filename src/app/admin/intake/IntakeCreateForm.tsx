'use client'

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
  const tierOptions = getIntakeTierOptions()
  const selectedCategory = KATEGORIEN.find(k => k.value === formData.hauptkategorie)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Heading level={2} className="text-lg font-semibold">Neues Gerät erfassen</Heading>
        <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tier Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Verarbeitungsstufe</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tierOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData(f => ({ ...f, intake_tier: opt.value }))}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                formData.intake_tier === opt.value
                  ? 'border-info-500 bg-info-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-neutral-500">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Quick Input */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setAiOpen(!aiOpen)}
          className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 text-left"
        >
          <span className="text-sm font-medium text-purple-800 flex items-center gap-2">
            <Loader2 className="w-4 h-4" />
            KI-Schnelleingabe
          </span>
          {aiOpen ? <ChevronDown className="w-4 h-4 text-purple-600" /> : <ChevronRight className="w-4 h-4 text-purple-600" />}
        </button>

        {aiOpen && (
          <div className="p-4 space-y-3 bg-white">
            {/* Tabs */}
            <div className="flex gap-1 border-b">
              {([
                { key: 'text' as const, icon: Type, label: 'Text' },
                { key: 'voice' as const, icon: Mic, label: 'Sprache' },
                { key: 'photo' as const, icon: Camera, label: 'Foto' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAiTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                    aiTab === tab.key
                      ? 'border-purple-600 text-purple-700 font-medium'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Text Tab */}
            {aiTab === 'text' && (
              <div className="space-y-2">
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="z.B. Dell Latitude E7470 i5 8GB 256GB SSD guter Zustand"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={onAiTextExtract}
                  disabled={aiLoading || aiText.trim().length < 3}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
                  Analysieren
                </button>
              </div>
            )}

            {/* Voice Tab */}
            {aiTab === 'voice' && (
              <div className="space-y-2">
                {voiceState === 'idle' && (
                  <button
                    type="button"
                    onClick={onStartVoiceRecording}
                    className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg hover:border-purple-400 w-full justify-center text-sm text-neutral-600"
                  >
                    <Mic className="w-5 h-5" />
                    Aufnahme starten
                  </button>
                )}
                {voiceState === 'recording' && (
                  <button
                    type="button"
                    onClick={onStopVoiceRecording}
                    className="flex items-center gap-2 px-4 py-3 bg-error-50 border-2 border-error-300 rounded-lg w-full justify-center text-sm text-error-700 animate-pulse"
                  >
                    <Mic className="w-5 h-5" />
                    Aufnahme stoppen
                  </button>
                )}
                {voiceState === 'processing' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-lg justify-center text-sm text-purple-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verarbeite Sprache...
                  </div>
                )}
                {aiText && voiceState === 'idle' && (
                  <p className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded">Transkription: {aiText}</p>
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
              <div className="flex items-center gap-2 text-sm text-error-600 bg-error-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {aiError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hersteller *</label>
          <input
            type="text"
            value={formData.hersteller}
            onChange={(e) => setFormData(f => ({ ...f, hersteller: e.target.value }))}
            placeholder="z.B. Lenovo, Apple, Dell"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Produktname *</label>
          <input
            type="text"
            value={formData.produktname}
            onChange={(e) => setFormData(f => ({ ...f, produktname: e.target.value }))}
            placeholder="z.B. ThinkPad T480"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kurzbeschreibung</label>
        <textarea
          value={formData.kurzbeschreibung}
          onChange={(e) => setFormData(f => ({ ...f, kurzbeschreibung: e.target.value }))}
          placeholder="Kurze Beschreibung des Geräts und seines Zustands"
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kategorie</label>
          <select
            value={formData.hauptkategorie}
            onChange={(e) => setFormData(f => ({ ...f, hauptkategorie: e.target.value, unterkategorie: '' }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Wählen...</option>
            {KATEGORIEN.map(k => (
              <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unterkategorie</label>
          <select
            value={formData.unterkategorie}
            onChange={(e) => setFormData(f => ({ ...f, unterkategorie: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            disabled={!selectedCategory}
          >
            <option value="">Wählen...</option>
            {selectedCategory?.subs.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Zustand *</label>
          <select
            value={formData.zustand}
            onChange={(e) => setFormData(f => ({ ...f, zustand: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {ZUSTAND_OPTIONS.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>
      </div>

      {formData.intake_tier === INTAKE_TIERS.REFURBISH && (
        <div>
          <label className="block text-sm font-medium mb-1">Geschätzter Verkaufspreis (CHF)</label>
          <input
            type="number"
            value={formData.verkaufspreis || ''}
            onChange={(e) => setFormData(f => ({ ...f, verkaufspreis: Number(e.target.value) }))}
            placeholder="0"
            min={0}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* Donation Toggle */}
      <div className="border rounded-lg p-4 bg-primary-50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_donation}
            onChange={(e) => setFormData(f => ({ ...f, is_donation: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm font-medium">Dies ist eine Spende</span>
        </label>

        {formData.is_donation && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-neutral-600">Name Spender/in</label>
              <input
                type="text"
                value={formData.donor_name}
                onChange={(e) => setFormData(f => ({ ...f, donor_name: e.target.value }))}
                placeholder="Optional"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-neutral-600">E-Mail Spender/in</label>
              <input
                type="email"
                value={formData.donor_email}
                onChange={(e) => setFormData(f => ({ ...f, donor_email: e.target.value }))}
                placeholder="Optional"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1 text-neutral-600">Notizen zur Spende</label>
              <input
                type="text"
                value={formData.donor_notes}
                onChange={(e) => setFormData(f => ({ ...f, donor_notes: e.target.value }))}
                placeholder="z.B. Übergeben am Standort Zürich"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
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
          {saving ? 'Speichern...' : 'Gerät erfassen'}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
