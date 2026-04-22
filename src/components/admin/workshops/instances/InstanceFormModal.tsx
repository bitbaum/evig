'use client'

import { X, Loader2, Save } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
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
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <Heading level={2} className="text-xl text-gray-900">
            {editingInstance ? 'Termin bearbeiten' : 'Neuer Termin'}
          </Heading>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workshop *
            </label>
            <select
              value={formData.workshopId}
              onChange={(e) => setFormData(prev => ({ ...prev, workshopId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!!editingInstance}
            >
              <option value="">Workshop auswählen...</option>
              {workshops.map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ende
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ort
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={`z.B. RevampIT, ${LOCATIONS.store.full}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leitung
              </label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Name des Kursleiters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max. Teilnehmer
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                placeholder="Standard vom Workshop"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Geplant</option>
              <option value="cancelled">Abgesagt</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Interne Notizen..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !formData.workshopId || !formData.startDate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingInstance ? 'Speichern' : 'Erstellen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
