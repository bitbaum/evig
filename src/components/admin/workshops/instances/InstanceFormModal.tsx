'use client'

import { Loader2, Save } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import type { Workshop, WorkshopInstanceWithDetails, InstanceFormData } from './types'
import { ORG, BASE_REGION } from '@/config/org'
import { WORKSHOP_INSTANCE_STATUS, WORKSHOP_INSTANCE_STATUS_LABELS } from '@/config/workshops'

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
    <Modal isOpen onClose={onClose} title={editingInstance ? 'Termin bearbeiten' : 'Neuer Termin'}>
        <div className="space-y-4">
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
              placeholder={`z.B. ${ORG.name}, ${BASE_REGION.city}`}
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
              {Object.values(WORKSHOP_INSTANCE_STATUS).map(status => (
                <option key={status} value={status}>{WORKSHOP_INSTANCE_STATUS_LABELS[status]}</option>
              ))}
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

        <div className="mt-6 pt-4 border-t border flex justify-end gap-3">
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
    </Modal>
  )
}
