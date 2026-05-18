'use client'

import { X, Loader2, Save } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import type { Workshop, WorkshopInstanceWithDetails, InstanceFormData } from './types'
import { LOCATIONS } from '@/config/org'

interface InstanceFormModalProps {
  editingInstance: WorkshopInstanceWithDetails | null
  formData: InstanceFormData
  setFormData: React.Dispatch<React.SetStateAction<InstanceFormData>>
  workshops: Workshop[]
  submitting: boolean
  error: string
  onSubmit: () => void
  onClose: () => void
}

export function InstanceFormModal({
  editingInstance,
  formData,
  setFormData,
  workshops,
  submitting,
  error,
  onSubmit,
  onClose,
}: InstanceFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:border dark:border-white/[0.06] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <Heading level={2} className="text-xl text-neutral-900">
            {editingInstance ? 'Termin bearbeiten' : 'Neuer Termin'}
          </Heading>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-3 text-error-800 dark:text-error-400 text-sm">
              {error}
            </div>
          )}

          <FormField label="Workshop" required htmlFor="instance-workshop">
            <Select
              id="instance-workshop"
              value={formData.workshopId}
              onChange={(e) => setFormData(prev => ({ ...prev, workshopId: e.target.value }))}
              disabled={!!editingInstance}
            >
              <option value="">Workshop auswählen...</option>
              {workshops.map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start" required htmlFor="instance-start">
              <Input
                id="instance-start"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </FormField>

            <FormField label="Ende" htmlFor="instance-end">
              <Input
                id="instance-end"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Ort" htmlFor="instance-location">
            <Input
              id="instance-location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={`z.B. RevampIT, ${LOCATIONS.store.full}`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Leitung" htmlFor="instance-instructor">
              <Input
                id="instance-instructor"
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Name des Kursleiters"
              />
            </FormField>

            <FormField label="Max. Teilnehmer" htmlFor="instance-max">
              <Input
                id="instance-max"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                placeholder="Standard vom Workshop"
              />
            </FormField>
          </div>

          <FormField label="Status" htmlFor="instance-status">
            <Select
              id="instance-status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="scheduled">Geplant</option>
              <option value="cancelled">Abgesagt</option>
              <option value="completed">Abgeschlossen</option>
            </Select>
          </FormField>

          <FormField label="Notizen">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Interne Notizen..."
              rows={3}
            />
          </FormField>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Abbrechen
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !formData.workshopId || !formData.startDate}
            variant="primary"
            className="gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Speichern...' : (editingInstance ? 'Speichern' : 'Erstellen')}
          </Button>
        </div>
      </div>
    </div>
  )
}
