import { Heart, Package } from 'lucide-react'
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
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

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
    <Modal isOpen={true} onClose={onClose} title="Spende erfassen" size="lg">
      <div>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => onFormTypeChange(DONATION_TYPES.MONETARY)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                formType === DONATION_TYPES.MONETARY
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700'
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
                  ? 'bg-info-600 text-white'
                  : 'bg-neutral-100 text-neutral-700'
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
                <FormField label="Betrag (CHF)" required htmlFor="donation-amount">
                  <Input
                    id="donation-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.amount_chf}
                    onChange={(e) => updateField('amount_chf', e.target.value)}
                    placeholder="100.00"
                    required
                    aria-required="true"
                  />
                </FormField>
                <FormField label="Zahlungsmethode" htmlFor="donation-payment-method">
                  <Select
                    id="donation-payment-method"
                    value={formData.payment_method}
                    onChange={(e) => updateField('payment_method', e.target.value)}
                  >
                    <option value="">-- Wählen --</option>
                    {getPaymentMethodOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </FormField>
              </>
            )}

            {/* Device Fields */}
            {formType === DONATION_TYPES.DEVICE && (
              <>
                <FormField label="Gerätekategorie" required htmlFor="device-category">
                  <Select
                    id="device-category"
                    value={formData.device_category}
                    onChange={(e) => {
                      const cat = e.target.value
                      const estimated = cat ? (getEstimatedValue(cat) / 100).toFixed(2) : ''
                      onFormDataChange({ ...formData, device_category: cat, estimated_value_chf: estimated })
                    }}
                    required
                    aria-required="true"
                  >
                    <option value="">-- Wählen --</option>
                    {getDeviceCategoryOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Marke" htmlFor="device-brand">
                    <Input
                      id="device-brand"
                      type="text"
                      value={formData.device_brand}
                      onChange={(e) => updateField('device_brand', e.target.value)}
                      placeholder="z.B. Lenovo"
                    />
                  </FormField>
                  <FormField label="Modell" htmlFor="device-model">
                    <Input
                      id="device-model"
                      type="text"
                      value={formData.device_model}
                      onChange={(e) => updateField('device_model', e.target.value)}
                      placeholder="z.B. ThinkPad T480"
                    />
                  </FormField>
                </div>
                <FormField label="Zustand" htmlFor="device-condition">
                  <Select
                    id="device-condition"
                    value={formData.device_condition}
                    onChange={(e) => updateField('device_condition', e.target.value)}
                  >
                    <option value="">-- Wählen --</option>
                    {getDeviceConditionOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Beschreibung">
                  <Textarea
                    value={formData.device_description}
                    onChange={(e) => updateField('device_description', e.target.value)}
                    rows={2}
                    placeholder="Details zum Gerät..."
                  />
                </FormField>
                <FormField label="Geschätzter Wert (CHF)" htmlFor="device-estimated-value">
                  <Input
                    id="device-estimated-value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimated_value_chf}
                    onChange={(e) => updateField('estimated_value_chf', e.target.value)}
                    placeholder="50.00"
                  />
                </FormField>
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
            <FormField label={<>Name des Spenders {selectedUser && <span className="text-neutral-400 font-normal">(überschreibt Benutzer)</span>}</>} htmlFor="donor-name">
              <Input
                id="donor-name"
                type="text"
                value={formData.donor_name}
                onChange={(e) => updateField('donor_name', e.target.value)}
                placeholder={selectedUser ? selectedUser.name || 'Kein Name' : 'Max Muster'}
              />
            </FormField>
            <FormField label={<>E-Mail des Spenders {selectedUser && <span className="text-neutral-400 font-normal">(überschreibt Benutzer)</span>}</>} htmlFor="donor-email">
              <Input
                id="donor-email"
                type="email"
                value={formData.donor_email}
                onChange={(e) => updateField('donor_email', e.target.value)}
                placeholder={selectedUser ? selectedUser.email : 'max@example.com'}
              />
            </FormField>
            <FormField label="Notizen">
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                placeholder="Interne Notizen..."
              />
            </FormField>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="receipt_requested"
                checked={formData.receipt_requested}
                onChange={(e) => updateField('receipt_requested', e.target.checked)}
                className="w-4 h-4 text-primary-600"
              />
              <label htmlFor="receipt_requested" className="text-sm text-neutral-700">
                Spendenquittung angefordert
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Speichern...' : 'Spende erfassen'}
              </Button>
            </div>
          </form>
      </div>
    </Modal>
  )
}
