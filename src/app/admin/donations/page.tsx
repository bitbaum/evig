'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDateNumeric } from '@/lib/date-formats'
import {
  Heart,
  Package,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  Receipt,
  User,
  Mail,
  ArrowLeft,
  X,
} from 'lucide-react'
import { ERROR_MESSAGES } from '@/config/error-messages'
import {
  DONATION_TYPES,
  DONATION_STATUSES,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  PAYMENT_METHODS,
  getDonationTypeLabel,
  getDeviceCategoryLabel,
  getDeviceConditionLabel,
  getPaymentMethodLabel,
  getDonationStatusLabel,
  formatAmountCHF,
  getDonationTypeOptions,
  getDeviceCategoryOptions,
  getDeviceConditionOptions,
  getPaymentMethodOptions,
  getDonationStatusOptions,
  getEstimatedValue,
  type DonationType,
  type DonationStatus,
} from '@/config/donations'

interface Donation {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  donation_type: DonationType
  // Monetary
  amount_cents: number | null
  currency: string
  payment_method: string | null
  // Device
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  estimated_value_cents: number | null
  // Anonymous
  donor_name: string | null
  donor_email: string | null
  // Status
  status: string
  recorded_by_name: string | null
  receipt_requested: boolean
  receipt_sent: boolean
  thank_you_sent: boolean
  notes: string | null
  // Timestamps
  created_at: string
}

interface Stats {
  total: number
  monetary: number
  device: number
  pendingThanks: number
  pendingReceipts: number
  totalValueCents: number
}

export default function AdminDonationsPage() {
  const { data: session, status } = useSession()

  const [donations, setDonations] = useState<Donation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [filters, setFilters] = useState<{
    donation_type: DonationType | 'all'
    status: DonationStatus | 'all'
  }>({
    donation_type: 'all',
    status: 'all',
  })

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<DonationType>(DONATION_TYPES.MONETARY)
  const [submitting, setSubmitting] = useState(false)

  // User search state
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Monetary
    amount_chf: '',
    payment_method: '',
    // Device
    device_category: '',
    device_brand: '',
    device_model: '',
    device_description: '',
    device_condition: '',
    estimated_value_chf: '',
    // Common
    donor_name: '',
    donor_email: '',
    receipt_requested: false,
    notes: '',
  })

  const loadDonations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '50' })

      if (filters.donation_type !== 'all') {
        params.set('donation_type', filters.donation_type)
      }
      if (filters.status !== 'all') {
        params.set('status', filters.status)
      }

      const response = await fetch(`/api/admin/donations?${params}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const items = result.data.items || []
          setDonations(items)

          // Calculate stats
          const monetary = items.filter((d: Donation) => d.donation_type === DONATION_TYPES.MONETARY)
          const device = items.filter((d: Donation) => d.donation_type === DONATION_TYPES.DEVICE)
          const pendingThanks = items.filter((d: Donation) => !d.thank_you_sent)
          const pendingReceipts = items.filter((d: Donation) => d.receipt_requested && !d.receipt_sent)
          const totalValue = items.reduce((sum: number, d: Donation) => {
            if (d.donation_type === DONATION_TYPES.MONETARY && d.amount_cents) {
              return sum + d.amount_cents
            }
            if (d.donation_type === DONATION_TYPES.DEVICE && d.estimated_value_cents) {
              return sum + d.estimated_value_cents
            }
            return sum
          }, 0)

          setStats({
            total: items.length,
            monetary: monetary.length,
            device: device.length,
            pendingThanks: pendingThanks.length,
            pendingReceipts: pendingReceipts.length,
            totalValueCents: totalValue,
          })
        } else {
          setError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
        }
      } else {
        setError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }, [filters.donation_type, filters.status])

  useEffect(() => {
    if (status === 'authenticated') {
      loadDonations()
    }
  }, [status, loadDonations])

  // User search with debounce
  useEffect(() => {
    if (userSearch.length < 2) {
      setUserResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const response = await fetch(`/api/admin/donations/users?search=${encodeURIComponent(userSearch)}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setUserResults(result.data.users || [])
          }
        }
      } catch {
        // Ignore search errors
      } finally {
        setSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [userSearch])

  const handleSelectUser = (user: { id: string; name: string | null; email: string }) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      donor_name: user.name || '',
      donor_email: user.email,
    })
    setUserSearch('')
    setUserResults([])
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setFormData({
      ...formData,
      donor_name: '',
      donor_email: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        donation_type: formType,
        user_id: selectedUser?.id || null,
        donor_name: formData.donor_name || null,
        donor_email: formData.donor_email || null,
        receipt_requested: formData.receipt_requested,
        notes: formData.notes || null,
      }

      if (formType === DONATION_TYPES.MONETARY) {
        const amountCents = Math.round(parseFloat(formData.amount_chf) * 100)
        if (isNaN(amountCents) || amountCents < 100) {
          alert('Bitte geben Sie einen gültigen Betrag ein (mind. CHF 1.00)')
          setSubmitting(false)
          return
        }
        payload.amount_cents = amountCents
        payload.payment_method = formData.payment_method || null
      } else {
        if (!formData.device_category) {
          alert('Bitte wählen Sie eine Gerätekategorie')
          setSubmitting(false)
          return
        }
        payload.device_category = formData.device_category
        payload.device_brand = formData.device_brand || null
        payload.device_model = formData.device_model || null
        payload.device_description = formData.device_description || null
        payload.device_condition = formData.device_condition || null
        if (formData.estimated_value_chf) {
          payload.estimated_value_cents = Math.round(parseFloat(formData.estimated_value_chf) * 100)
        }
      }

      const response = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowForm(false)
        setSelectedUser(null)
        setUserSearch('')
        setUserResults([])
        setFormData({
          amount_chf: '',
          payment_method: '',
          device_category: '',
          device_brand: '',
          device_model: '',
          device_description: '',
          device_condition: '',
          estimated_value_chf: '',
          donor_name: '',
          donor_email: '',
          receipt_requested: false,
          notes: '',
        })
        loadDonations()
      } else {
        const result = await response.json()
        alert(result.error || 'Fehler beim Speichern')
      }
    } catch {
      alert(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkThanked = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thank_you_sent: true, status: DONATION_STATUSES.THANKED }),
      })
      if (response.ok) {
        loadDonations()
      }
    } catch {
      alert(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }

  const handleMarkReceiptSent = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_sent: true, status: DONATION_STATUSES.RECEIPT_SENT }),
      })
      if (response.ok) {
        loadDonations()
      }
    } catch {
      alert(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }


  const getDonationIcon = (type: DonationType) => {
    return type === DONATION_TYPES.DEVICE
      ? <Package className="w-5 h-5" />
      : <Heart className="w-5 h-5" />
  }

  const getDonationValue = (donation: Donation): string => {
    if (donation.donation_type === DONATION_TYPES.MONETARY) {
      return formatAmountCHF(donation.amount_cents)
    }
    if (donation.estimated_value_cents) {
      return `~${formatAmountCHF(donation.estimated_value_cents)}`
    }
    return '-'
  }

  const getDeviceTitle = (donation: Donation): string => {
    const parts: string[] = []
    if (donation.device_brand) parts.push(donation.device_brand)
    if (donation.device_model) parts.push(donation.device_model)
    if (parts.length > 0) return parts.join(' ')
    if (donation.device_category) return getDeviceCategoryLabel(donation.device_category)
    return 'Sachspende'
  }

  const getDonorDisplay = (donation: Donation): string => {
    if (donation.user_name) return donation.user_name
    if (donation.donor_name) return donation.donor_name
    if (donation.user_email) return donation.user_email
    if (donation.donor_email) return donation.donor_email
    return 'Anonym'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spenden</h1>
          <p className="text-gray-600">Geld- und Sachspenden verwalten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Spende erfassen
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Spenden</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-gray-900">{stats.monetary}</div>
            <div className="text-sm text-gray-600">Geldspenden</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-gray-900">{stats.device}</div>
            <div className="text-sm text-gray-600">Sachspenden</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-gray-900">{stats.pendingThanks}</div>
            <div className="text-sm text-gray-600">Dank ausstehend</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-gray-900">{formatAmountCHF(stats.totalValueCents)}</div>
            <div className="text-sm text-gray-600">Gesamtwert</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <select
            value={filters.donation_type}
            onChange={(e) => setFilters({ ...filters, donation_type: e.target.value as DonationType | 'all' })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Typen</option>
            {getDonationTypeOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as DonationStatus | 'all' })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Status</option>
            {getDonationStatusOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beschreibung</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spender</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wert</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    donation.donation_type === DONATION_TYPES.MONETARY
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {getDonationIcon(donation.donation_type)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {donation.donation_type === DONATION_TYPES.MONETARY
                      ? 'Geldspende'
                      : getDeviceTitle(donation)
                    }
                  </div>
                  {donation.donation_type === DONATION_TYPES.DEVICE && donation.device_category && (
                    <div className="text-xs text-gray-500">
                      {getDeviceCategoryLabel(donation.device_category)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{getDonorDisplay(donation)}</div>
                  {donation.donor_email && (
                    <div className="text-xs text-gray-500">{donation.donor_email}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {getDonationValue(donation)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{formatDateNumeric(donation.created_at)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    donation.status === DONATION_STATUSES.RECEIPT_SENT
                      ? 'bg-green-100 text-green-800'
                      : donation.status === DONATION_STATUSES.THANKED
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
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
                        onClick={() => handleMarkThanked(donation.id)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Als bedankt markieren"
                      >
                        Bedanken
                      </button>
                    )}
                    {donation.receipt_requested && !donation.receipt_sent && (
                      <button
                        onClick={() => handleMarkReceiptSent(donation.id)}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                        title="Quittung als gesendet markieren"
                      >
                        Quittung
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Keine Spenden gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Donation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Spende erfassen</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setFormType(DONATION_TYPES.MONETARY)}
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
                  onClick={() => setFormType(DONATION_TYPES.DEVICE)}
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

              <form onSubmit={handleSubmit} className="space-y-4">
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
                        onChange={(e) => setFormData({ ...formData, amount_chf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="100.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsmethode</label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
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
                          setFormData({ ...formData, device_category: cat, estimated_value_chf: estimated })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
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
                          onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="z.B. Lenovo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
                        <input
                          type="text"
                          value={formData.device_model}
                          onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="z.B. ThinkPad T480"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zustand</label>
                      <select
                        value={formData.device_condition}
                        onChange={(e) => setFormData({ ...formData, device_condition: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, device_description: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, estimated_value_chf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="50.00"
                      />
                    </div>
                  </>
                )}

                {/* Donor Section */}
                <hr className="my-4" />

                {/* User Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benutzer verknüpfen (optional)
                  </label>
                  {selectedUser ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {selectedUser.name || selectedUser.email}
                        </div>
                        {selectedUser.name && (
                          <div className="text-xs text-gray-500">{selectedUser.email}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearUser}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Benutzer suchen (Name oder E-Mail)..."
                        />
                        {searchingUsers && (
                          <div className="absolute right-3">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {userResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {userResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || user.email}
                                </div>
                                {user.name && (
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Suchen Sie nach einem bestehenden Benutzer oder geben Sie die Daten manuell ein.
                  </p>
                </div>

                {/* Manual Donor Info (for anonymous or non-users) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name des Spenders {selectedUser && <span className="text-gray-400">(überschreibt Benutzer)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.donor_name}
                    onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={selectedUser ? selectedUser.email : 'max@example.com'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, receipt_requested: e.target.checked })}
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
                    onClick={() => setShowForm(false)}
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
      )}
    </div>
  )
}
