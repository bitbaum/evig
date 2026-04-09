import { Wrench } from 'lucide-react'
import type { RepairerApplicationForm, FormUpdater } from './types'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: RepairerApplicationForm
  setFormData: FormUpdater
}

export function BusinessInfoSection({ formData, setFormData }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Wrench className="w-5 h-5 mr-2" />
        Geschäftsinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geschäftstyp *
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value as RepairerApplicationForm['businessType'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          >
            <option value="individual">Einzelperson</option>
            <option value="freelance">Freiberufler</option>
            <option value="business">Geschäft/Firma</option>
          </select>
        </div>

        {(formData.businessType === 'business' || formData.businessType === 'freelance') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geschäftsfirmenname *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jahre Erfahrung *
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.yearsExperience}
            onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung deiner Dienstleistungen *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Beschreibe deine Reparaturdienstleistungen, Fachgebiete und besondere Stärken..."
            required
            aria-required="true"
          />
        </div>
      </div>
    </div>
  )
}
