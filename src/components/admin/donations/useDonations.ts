import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client';
import { useSwrFetch } from '@/lib/api/swr';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import { API_DEFAULTS } from '@/config/api-defaults';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { DONATION_TYPES, DONATION_STATUSES, type DonationType } from '@/config/donations';
import type {
  Donation,
  DonationStats,
  DonationFormData,
  DonationFiltersState,
  UserResult,
} from './types';
import { DEFAULT_FORM_DATA } from './types';

export function useDonations() {
  const { status: sessionStatus } = useSession();

  const [filters, setFilters] = useState<DonationFiltersState>({
    donation_type: 'all',
    status: 'all',
  });

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<DonationType>(DONATION_TYPES.MONETARY);
  const [submitting, setSubmitting] = useState(false);

  // User search state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  // Form state
  const [formData, setFormData] = useState<DonationFormData>(DEFAULT_FORM_DATA);

  // Filters are encoded in the SWR key (fetch gated on an authenticated session).
  const params = new URLSearchParams({ limit: String(API_DEFAULTS.PAGINATION_LIMIT) });
  if (filters.donation_type !== 'all') {
    params.set('donation_type', filters.donation_type);
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }

  const {
    data: donationsData,
    error: loadError,
    isLoading: loading,
    mutate,
  } = useSwrFetch<{ items: Donation[] }>(
    sessionStatus === 'authenticated' ? `/api/admin/donations?${params}` : null,
  );
  const donations = useMemo(() => donationsData?.items ?? [], [donationsData]);
  const error = loadError instanceof Error ? loadError.message || ERROR_MESSAGES.NETWORK_ERROR : '';

  // Stats derive from the loaded page — pure computation, no second state copy.
  const stats: DonationStats | null = useMemo(() => {
    if (!donationsData) return null;
    const items = donations;
    const totalValue = items.reduce((sum: number, d: Donation) => {
      if (d.donation_type === DONATION_TYPES.MONETARY && d.amount_cents)
        return sum + d.amount_cents;
      if (d.donation_type === DONATION_TYPES.DEVICE && d.estimated_value_cents)
        return sum + d.estimated_value_cents;
      return sum;
    }, 0);
    return {
      total: items.length,
      monetary: items.filter((d: Donation) => d.donation_type === DONATION_TYPES.MONETARY).length,
      device: items.filter((d: Donation) => d.donation_type === DONATION_TYPES.DEVICE).length,
      pendingThanks: items.filter((d: Donation) => !d.thank_you_sent).length,
      pendingReceipts: items.filter((d: Donation) => d.receipt_requested && !d.receipt_sent).length,
      totalValueCents: totalValue,
    };
  }, [donationsData, donations]);

  const loadDonations = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // User search: debounced term becomes the SWR key (null under 2 chars = no
  // request, empty results). Search errors stay silent, as before.
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const userSearchKey =
    debouncedUserSearch.length >= 2
      ? `/api/admin/donations/users?search=${encodeURIComponent(debouncedUserSearch)}`
      : null;
  const { data: userSearchData, isLoading: searchingUsers } = useSwrFetch<{ users: UserResult[] }>(
    userSearchKey,
  );
  const userResults = userSearchKey ? (userSearchData?.users ?? []) : [];

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, donor_name: user.name || '', donor_email: user.email }));
    setUserSearch('');
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setFormData((prev) => ({ ...prev, donor_name: '', donor_email: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        donation_type: formType,
        user_id: selectedUser?.id || null,
        donor_name: formData.donor_name || null,
        donor_email: formData.donor_email || null,
        receipt_requested: formData.receipt_requested,
        notes: formData.notes || null,
      };

      if (formType === DONATION_TYPES.MONETARY) {
        const amountCents = Math.round(parseFloat(formData.amount_chf) * 100);
        if (isNaN(amountCents) || amountCents < 100) {
          toast.error('Bitte gib einen gültigen Betrag ein (mind. CHF 1.00)');
          setSubmitting(false);
          return;
        }
        payload.amount_cents = amountCents;
        payload.payment_method = formData.payment_method || null;
      } else {
        if (!formData.device_category) {
          toast.error('Bitte wähle eine Gerätekategorie');
          setSubmitting(false);
          return;
        }
        payload.device_category = formData.device_category;
        payload.device_brand = formData.device_brand || null;
        payload.device_model = formData.device_model || null;
        payload.device_description = formData.device_description || null;
        payload.device_condition = formData.device_condition || null;
        if (formData.estimated_value_chf) {
          payload.estimated_value_cents = Math.round(
            parseFloat(formData.estimated_value_chf) * 100,
          );
        }
      }

      const result = await apiFetch<unknown>('/api/admin/donations', {
        method: 'POST',
        body: payload,
      });

      if (result.success) {
        setShowForm(false);
        setSelectedUser(null);
        setUserSearch('');
        setFormData(DEFAULT_FORM_DATA);
        loadDonations();
      } else {
        toast.error(result.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      logger.warn('Failed to save donation', { error: err });
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkThanked = async (id: string) => {
    try {
      const result = await apiFetch<unknown>(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        body: { thank_you_sent: true, status: DONATION_STATUSES.THANKED },
      });
      if (result.success) loadDonations();
    } catch (err) {
      logger.warn('Failed to mark donation as thanked', { error: err, donationId: id });
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  };

  const handleMarkReceiptSent = async (id: string) => {
    try {
      const result = await apiFetch<unknown>(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        body: { receipt_sent: true, status: DONATION_STATUSES.RECEIPT_SENT },
      });
      if (result.success) loadDonations();
    } catch (err) {
      logger.warn('Failed to mark donation receipt sent', { error: err, donationId: id });
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  };

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
  };
}
