import { Heart, Package, X } from 'lucide-react'
import {
  DONATION_TYPES,
  getPaymentMethodOptions,
  getDeviceCategoryOptions,
  getDeviceConditionOptions,
  getEstimatedValue,
  type DonationType,
} from '@/config/donations'
import type { DonationFormData, UserResult } from './types'
import { UserSearchField } from './UserSearchField'

interface Props {
  formType: DonationType
  formData: DonationFormData
  submitting: boolean
  selectedUser: UserResult | null
  userSearch: string
  userResults: UserResult[]
  searchingUsers: boolean
  onFormTypeChange: (type: DonationType) => void
  onFormDataChange: (data: DonationFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onSearchChange: (value: string) => void
  onSelectUser: (user: UserResult) => void
  onClearUser: () => void
}

export function DonationFormModal({
  formType,
  formData,
  submitting,
  selectedUser,
  userSearch,
  userResults,
  searchingUsers,
  onFormTypeChange,
  onFormDataChange,
  onSubmit,
  onClose,
  onSearchChange,
  onSelectUser,
  onClearUser,
}: Props) {
  const updateField = (field: keyof DonationFormData, value: string | boolean) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Spende erfassen</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => onFormTypeChange(DONATION_TYPES.MONETARY)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                formType === DONATION_TYPES.MONETARY
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Heart className="w-5 h-5" />
              Geldspende
            </button>
            <button
              type="button"
              onClick={() => onFormTypeChange(DONATION_TYPES.DEVICE)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                formType === DONATION_TYPES.DEVICE
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Package className="w-5 h-5" />
              Sachspende
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Monetary Fields */}
            {formType === DONATION_TYPES.MONETARY && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betrag (CHF) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.amount_chf}
                    onChange={(e) => updateField('amount_chf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="100.00"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsmethode</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => updateField('payment_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Wählen --</option>
                    {getPaymentMethodOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Device Fields */}
            {formType === DONATION_TYPES.DEVICE && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gerätekategorie *</label>
                  <select
                    value={formData.device_category}
                    onChange={(e) => {
                      const cat = e.target.value
                      const estimated = cat ? (getEstimatedValue(cat) / 100).toFixed(2) : ''
                      onFormDataChange({ ...formData, device_category: cat, estimated_value_chf: estimated })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    aria-required="true"
                  >
                    <option value="">-- Wählen --</option>
                    {getDeviceCategoryOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marke</label>
                    <input
                      type="text"
                      value={formData.device_brand}
                      onChange={(e) => updateField('device_brand', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="z.B. Lenovo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
                    <input
                      type="text"
                      value={formData.device_model}
                      onChange={(e) => updateField('device_model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="z.B. ThinkPad T480"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zustand</label>
                  <select
                    value={formData.device_condition}
                    onChange={(e) => updateField('device_condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Wählen --</option>
                    {getDeviceConditionOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea
                    value={formData.device_description}
                    onChange={(e) => updateField('device_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Details zum Gerät..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geschätzter Wert (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimated_value_chf}
                    onChange={(e) => updateField('estimated_value_chf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="50.00"
                  />
                </div>
              </>
            )}

            {/* Donor Section */}
            <hr className="my-4" />

            <UserSearchField
              selectedUser={selectedUser}
              userSearch={userSearch}
              userResults={userResults}
              searchingUsers={searchingUsers}
              onSearchChange={onSearchChange}
              onSelectUser={onSelectUser}
              onClearUser={onClearUser}
            />

            {/* Manual Donor Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name des Spenders {selectedUser && <span className="text-gray-400">(überschreibt Benutzer)</span>}
              </label>
              <input
                type="text"
                value={formData.donor_name}
                onChange={(e) => updateField('donor_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={selectedUser ? selectedUser.name || 'Kein Name' : 'Max Muster'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail des Spenders {selectedUser && <span className="text-gray-400">(überschreibt Benutzer)</span>}
              </label>
              <input
                type="email"
                value={formData.donor_email}
                onChange={(e) => updateField('donor_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={selectedUser ? selectedUser.email : 'max@example.com'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Interne Notizen..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="receipt_requested"
                checked={formData.receipt_requested}
                onChange={(e) => updateField('receipt_requested', e.target.checked)}
                className="w-4 h-4 text-green-600"
              />
              <label htmlFor="receipt_requested" className="text-sm text-gray-700">
                Spendenquittung angefordert
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Speichern...' : 'Spende erfassen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
