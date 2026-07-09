import { Link } from '@/i18n/navigation'
import { Heart, Package, CheckCircle, Clock, Receipt, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { ADMIN_CONTENT } from '@/config/admin-content'
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
  if (donations.length === 0) {
    return (
      <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
        <Heart className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="font-medium text-text-primary">{ADMIN_CONTENT.donations.emptyTitle}</p>
        <p className="text-text-secondary mt-1">{ADMIN_CONTENT.donations.emptyDescription}</p>
      </div>
    )
  }

  const columns: AdminTableColumn<Donation>[] = [
    {
      header: 'Typ',
      cell: (donation) => (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-action-muted text-action">
          {getDonationIcon(donation.donation_type)}
        </div>
      ),
    },
    {
      header: 'Beschreibung',
      cell: (donation) => (
        <>
          <div className="text-sm font-medium text-text-primary">
            {donation.donation_type === DONATION_TYPES.MONETARY
              ? 'Geldspende'
              : getDeviceTitle(donation)}
          </div>
          {donation.donation_type === DONATION_TYPES.DEVICE && donation.device_category && (
            <div className="text-xs text-text-tertiary">
              {getDeviceCategoryLabel(donation.device_category)}
            </div>
          )}
        </>
      ),
    },
    {
      header: 'Spender',
      cell: (donation) => (
        <>
          <div className="text-sm text-text-primary">{getDonorDisplay(donation)}</div>
          {donation.donor_email && (
            <div className="text-xs text-text-tertiary">{donation.donor_email}</div>
          )}
        </>
      ),
    },
    {
      header: 'Wert',
      cell: (donation) => (
        <div className="text-sm font-medium text-text-primary">{getDonationValue(donation)}</div>
      ),
    },
    {
      header: 'Datum',
      cell: (donation) => (
        <div className="text-sm text-text-primary">{formatDateNumeric(donation.created_at)}</div>
      ),
    },
    {
      header: 'Status',
      cell: (donation) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          donation.status === DONATION_STATUSES.RECEIPT_SENT
            ? 'bg-action-muted text-action'
            : donation.status === DONATION_STATUSES.THANKED
            ? 'bg-action-muted text-action'
            : 'bg-surface-raised text-text-primary'
        }`}>
          {donation.status === DONATION_STATUSES.RECEIPT_SENT && <Receipt className="w-3 h-3" />}
          {donation.status === DONATION_STATUSES.THANKED && <CheckCircle className="w-3 h-3" />}
          {donation.status === DONATION_STATUSES.RECORDED && <Clock className="w-3 h-3" />}
          {getDonationStatusLabel(donation.status)}
        </span>
      ),
    },
    {
      header: 'Aktionen',
      cell: (donation) => (
        <div className="flex gap-2">
          {!donation.thank_you_sent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkThanked(donation.id)}
              className="text-xs px-2 py-1 bg-action-muted text-action rounded-sm hover:bg-action-muted h-auto"
              title="Als bedankt markieren"
            >
              Bedanken
            </Button>
          )}
          {donation.receipt_requested && !donation.receipt_sent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkReceiptSent(donation.id)}
              className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-sm hover:bg-secondary-200 h-auto"
              title="Quittung als gesendet markieren"
            >
              Quittung
            </Button>
          )}
          {donation.donation_type === DONATION_TYPES.DEVICE && (
            <Link
              href={`/admin/intake?donation_id=${donation.id}&donor_name=${encodeURIComponent(donation.donor_name || '')}&donor_email=${encodeURIComponent(donation.donor_email || '')}`}
              className="text-xs px-2 py-1 bg-action-muted text-action rounded-sm hover:bg-action-muted inline-flex items-center gap-1"
              title="Im Geräte-Eingang erfassen"
            >
              Eingang <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ),
    },
  ]

  return <AdminTable columns={columns} rows={donations} rowKey={(d) => d.id} />
}
