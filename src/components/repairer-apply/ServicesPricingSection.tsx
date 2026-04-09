import { Star } from 'lucide-react'
import type { RepairerApplicationForm, FormUpdater } from './types'
import { SERVICE_OPTIONS, SPECIALIZATION_OPTIONS } from './config'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: RepairerApplicationForm
  setFormData: FormUpdater
}

export function ServicesPricingSection({ formData, setFormData }: Props) {
  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: checked
        ? [...prev.servicesOffered, serviceId]
        : prev.servicesOffered.filter(id => id !== serviceId),
    }))
  }

  const handleSpecializationChange = (specId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specId]
        : prev.specializations.filter(id => id !== specId),
    }))
  }

  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Star className="w-5 h-5 mr-2" />
        Dienstleistungen & Preise
      </Heading>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Welche Dienstleistungen bieten Sie an? *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICE_OPTIONS.map(option => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicesOffered.includes(option.id)}
                  onChange={(e) => handleServiceChange(option.id, e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Spezialisierungen (optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIALIZATION_OPTIONS.map(option => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(option.id)}
                  onChange={(e) => handleSpecializationChange(option.id, e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stundensatz (CHF) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="70.00"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notfallgebühr (CHF)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.emergencyFee}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyFee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hausbesuch (CHF)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.homeVisitFee}
              onChange={(e) => setFormData(prev => ({ ...prev, homeVisitFee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50.00"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
