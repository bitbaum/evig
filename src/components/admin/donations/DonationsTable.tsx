import { Link } from '@/i18n/navigation'
import { Heart, Package, CheckCircle, Clock, Receipt, ArrowRight } from 'lucide-react'
import { formatDateNumeric } from '@/lib/date-formats'
import {
  DONATION_TYPES,
  DONATION_STATUSES,
  formatAmountCHF,
  getDeviceCategoryLabel,
  getDonationStatusLabel,
  type DonationType,
} from '@/config/donations'
import type { Donation } from './types'

interface Props {
  donations: Donation[]
  onMarkThanked: (id: string) => void
  onMarkReceiptSent: (id: string) => void
}

function getDonationIcon(type: DonationType) {
  return type === DONATION_TYPES.DEVICE
    ? <Package className="w-5 h-5" />
    : <Heart className="w-5 h-5" />
}

function getDonationValue(donation: Donation): string {
  if (donation.donation_type === DONATION_TYPES.MONETARY) return formatAmountCHF(donation.amount_cents)
  if (donation.estimated_value_cents) return `~${formatAmountCHF(donation.estimated_value_cents)}`
  return '-'
}

function getDeviceTitle(donation: Donation): string {
  const parts: string[] = []
  if (donation.device_brand) parts.push(donation.device_brand)
  if (donation.device_model) parts.push(donation.device_model)
  if (parts.length > 0) return parts.join(' ')
  if (donation.device_category) return getDeviceCategoryLabel(donation.device_category)
  return 'Sachspende'
}

function getDonorDisplay(donation: Donation): string {
  if (donation.user_name) return donation.user_name
  if (donation.donor_name) return donation.donor_name
  if (donation.user_email) return donation.user_email
  if (donation.donor_email) return donation.donor_email
  return 'Anonym'
}

export function DonationsTable({ donations, onMarkThanked, onMarkReceiptSent }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Typ</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Beschreibung</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Spender</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Wert</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Datum</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Aktionen</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {donations.map((donation) => (
            <tr key={donation.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  donation.donation_type === DONATION_TYPES.MONETARY
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {getDonationIcon(donation.donation_type)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-neutral-900">
                  {donation.donation_type === DONATION_TYPES.MONETARY
                    ? 'Geldspende'
                    : getDeviceTitle(donation)
                  }
                </div>
                {donation.donation_type === DONATION_TYPES.DEVICE && donation.device_category && (
                  <div className="text-xs text-neutral-500">
                    {getDeviceCategoryLabel(donation.device_category)}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-neutral-900">{getDonorDisplay(donation)}</div>
                {donation.donor_email && (
                  <div className="text-xs text-neutral-500">{donation.donor_email}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-neutral-900">
                  {getDonationValue(donation)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-neutral-900">{formatDateNumeric(donation.created_at)}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  donation.status === DONATION_STATUSES.RECEIPT_SENT
                    ? 'bg-primary-100 text-primary-800'
                    : donation.status === DONATION_STATUSES.THANKED
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-neutral-100 text-neutral-800'
                }`}>
                  {donation.status === DONATION_STATUSES.RECEIPT_SENT && <Receipt className="w-3 h-3" />}
                  {donation.status === DONATION_STATUSES.THANKED && <CheckCircle className="w-3 h-3" />}
                  {donation.status === DONATION_STATUSES.RECORDED && <Clock className="w-3 h-3" />}
                  {getDonationStatusLabel(donation.status)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {!donation.thank_you_sent && (
                    <button
                      onClick={() => onMarkThanked(donation.id)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="Als bedankt markieren"
                    >
                      Bedanken
                    </button>
                  )}
                  {donation.receipt_requested && !donation.receipt_sent && (
                    <button
                      onClick={() => onMarkReceiptSent(donation.id)}
                      className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      title="Quittung als gesendet markieren"
                    >
                      Quittung
                    </button>
                  )}
                  {donation.donation_type === DONATION_TYPES.DEVICE && (
                    <Link
                      href={`/admin/intake?donation_id=${donation.id}&donor_name=${encodeURIComponent(donation.donor_name || '')}&donor_email=${encodeURIComponent(donation.donor_email || '')}`}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 inline-flex items-center gap-1"
                      title="Im Geräte-Eingang erfassen"
                    >
                      Eingang <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {donations.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                Keine Spenden gefunden
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
