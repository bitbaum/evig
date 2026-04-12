import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { API_DEFAULTS } from '@/config/api-defaults'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { DONATION_TYPES, DONATION_STATUSES, type DonationType } from '@/config/donations'
import type { Donation, DonationStats, DonationFormData, DonationFiltersState, UserResult } from './types'
import { DEFAULT_FORM_DATA } from './types'

export function useDonations() {
  const { status: sessionStatus } = useSession()

  const [donations, setDonations] = useState<Donation[]>([])
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState<DonationFiltersState>({
    donation_type: 'all',
    status: 'all',
  })

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<DonationType>(DONATION_TYPES.MONETARY)
  const [submitting, setSubmitting] = useState(false)

  // User search state
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)

  // Form state
  const [formData, setFormData] = useState<DonationFormData>(DEFAULT_FORM_DATA)

  const loadDonations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: String(API_DEFAULTS.PAGINATION_LIMIT) })

      if (filters.donation_type !== 'all') {
        params.set('donation_type', filters.donation_type)
      }
      if (filters.status !== 'all') {
        params.set('status', filters.status)
      }

      const result = await apiFetch<{ items: Donation[] }>(`/api/admin/donations?${params}`)

      if (result.success && result.data) {
        const items = result.data.items || []
        setDonations(items)

        const monetary = items.filter((d: Donation) => d.donation_type === DONATION_TYPES.MONETARY)
        const device = items.filter((d: Donation) => d.donation_type === DONATION_TYPES.DEVICE)
        const pendingThanks = items.filter((d: Donation) => !d.thank_you_sent)
        const pendingReceipts = items.filter((d: Donation) => d.receipt_requested && !d.receipt_sent)
        const totalValue = items.reduce((sum: number, d: Donation) => {
          if (d.donation_type === DONATION_TYPES.MONETARY && d.amount_cents) return sum + d.amount_cents
          if (d.donation_type === DONATION_TYPES.DEVICE && d.estimated_value_cents) return sum + d.estimated_value_cents
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
        setError(result.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }, [filters.donation_type, filters.status])

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadDonations()
    }
  }, [sessionStatus, loadDonations])

  // User search with debounce
  useEffect(() => {
    if (userSearch.length < 2) {
      setUserResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const result = await apiFetch<{ users: UserResult[] }>(`/api/admin/donations/users?search=${encodeURIComponent(userSearch)}`)
        if (result.success && result.data) {
          setUserResults(result.data.users || [])
        }
      } catch {
        // Ignore search errors
      } finally {
        setSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [userSearch])

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, donor_name: user.name || '', donor_email: user.email }))
    setUserSearch('')
    setUserResults([])
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setFormData(prev => ({ ...prev, donor_name: '', donor_email: '' }))
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
          alert('Bitte gib einen gültigen Betrag ein (mind. CHF 1.00)')
          setSubmitting(false)
          return
        }
        payload.amount_cents = amountCents
        payload.payment_method = formData.payment_method || null
      } else {
        if (!formData.device_category) {
          alert('Bitte wähle eine Gerätekategorie')
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

      const result = await apiFetch<unknown>('/api/admin/donations', {
        method: 'POST',
        body: payload,
      })

      if (result.success) {
        setShowForm(false)
        setSelectedUser(null)
        setUserSearch('')
        setUserResults([])
        setFormData(DEFAULT_FORM_DATA)
        loadDonations()
      } else {
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
      const result = await apiFetch<unknown>(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        body: { thank_you_sent: true, status: DONATION_STATUSES.THANKED },
      })
      if (result.success) loadDonations()
    } catch {
      alert(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }

  const handleMarkReceiptSent = async (id: string) => {
    try {
      const result = await apiFetch<unknown>(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        body: { receipt_sent: true, status: DONATION_STATUSES.RECEIPT_SENT },
      })
      if (result.success) loadDonations()
    } catch {
      alert(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }

  return {
    // Data
    donations,
    stats,
    loading: sessionStatus === 'loading' || loading,
    error,
    filters,
    setFilters,
    // Form
    showForm,
    setShowForm,
    formType,
    setFormType,
    formData,
    setFormData,
    submitting,
    handleSubmit,
    // User search
    userSearch,
    setUserSearch,
    userResults,
    searchingUsers,
    selectedUser,
    handleSelectUser,
    handleClearUser,
    // Actions
    handleMarkThanked,
    handleMarkReceiptSent,
  }
}
