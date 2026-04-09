import { FileText } from 'lucide-react'
import type { RepairerApplicationForm, FormUpdater } from './types'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: RepairerApplicationForm
  setFormData: FormUpdater
}

export function DocumentsSection({ formData, setFormData }: Props) {
  const handleFileUpload = (field: 'portfolioImages' | 'certificationsDocs', files: FileList) => {
    const fileArray = Array.from(files)
    setFormData(prev => ({
      ...prev,
      [field]: field === 'portfolioImages'
        ? [...prev.portfolioImages, ...fileArray].slice(0, 10)
        : [...prev.certificationsDocs, ...fileArray].slice(0, 5),
    }))
  }

  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Dokumente & Verifizierung
      </Heading>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ausweis/Personalausweis *
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files?.[0] && setFormData(prev => ({ ...prev, idDocument: e.target.files![0] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
          <p className="text-xs text-gray-500 mt-1">JPG, PNG oder PDF, max. 5MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zertifizierungen (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => e.target.files && handleFileUpload('certificationsDocs', e.target.files)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Max. 5 Dateien, JPG, PNG oder PDF</p>
          {formData.certificationsDocs.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {formData.certificationsDocs.length} Datei(en) ausgewählt
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio-Bilder (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload('portfolioImages', e.target.files)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Max. 10 Bilder, JPG oder PNG</p>
          {formData.portfolioImages.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {formData.portfolioImages.length} Bild(er) ausgewählt
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Haftpflichtversicherung
          </label>
          <textarea
            value={formData.insuranceInfo}
            onChange={(e) => setFormData(prev => ({ ...prev, insuranceInfo: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Versicherungsgesellschaft und Policennummer..."
          />
        </div>
      </div>
    </div>
  )
}
