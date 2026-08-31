'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { apiFetch } from '@/lib/api/client';
import { useSwrFetch } from '@/lib/api/swr';
import { ERROR_MESSAGES } from '@/config/error-messages';
import type {
  Workshop,
  WorkshopInstanceWithDetails,
  InstanceFormData,
  InstanceFiltersState,
} from './types';
import { initialFormData } from './types';
import {
  WORKSHOP_INSTANCE_STATUS,
  WORKSHOP_INSTANCE_STATUS_LABELS,
  WORKSHOP_INSTANCE_STATUS_COLORS,
} from '@/config/workshops';

export function useWorkshopInstances() {
  const { data: session, status: sessionStatus } = useSession();

  const [actionError, setError] = useState('');

  const [filters, setFilters] = useState<InstanceFiltersState>({
    workshopId: '',
    status: 'all',
    upcoming: false,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WorkshopInstanceWithDetails | null>(null);
  const [formData, setFormData] = useState<InstanceFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Both fetches are gated on an authenticated session via null SWR keys;
  // filters are encoded in the instances key, so changing them refetches.
  const authed = sessionStatus === 'authenticated';

  // Workshops list is auxiliary (dropdown options) — load errors are non-fatal
  // and intentionally not surfaced, matching the previous log-only behavior.
  const { data: workshopsData } = useSwrFetch<{ workshops: Workshop[] }>(
    authed ? '/api/admin/workshops/list' : null,
  );
  const workshops = workshopsData?.workshops ?? [];

  const params = new URLSearchParams();
  if (filters.workshopId) params.set('workshopId', filters.workshopId);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.upcoming) params.set('upcoming', 'true');

  const {
    data: instancesData,
    error: loadError,
    isLoading: loading,
    mutate,
  } = useSwrFetch<{ instances: WorkshopInstanceWithDetails[] }>(
    authed ? `/api/admin/workshops/instances?${params}` : null,
  );
  const instances = instancesData?.instances ?? [];
  // One error surface: action errors win (they're the fresher user feedback).
  const error =
    actionError ||
    (loadError instanceof Error
      ? loadError.message || 'Fehler beim Laden der Workshop-Termine'
      : '');

  const loadInstances = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const handleCreateOrUpdate = async () => {
    setSubmitting(true);
    setError('');

    try {
      const isEditing = !!editingInstance;
      const url = isEditing
        ? `/api/admin/workshops/instances/${editingInstance.id}`
        : '/api/admin/workshops/instances';

      const result = await apiFetch<void>(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: {
          workshopId: formData.workshopId,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          location: formData.location,
          instructor: formData.instructor || null,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          notes: formData.notes || null,
          status: formData.status,
        },
      });

      if (result.success) {
        setShowCreateModal(false);
        setEditingInstance(null);
        setFormData(initialFormData);
        loadInstances();
      } else {
        setError(result.error || 'Fehler beim Speichern');
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (instanceId: string) => {
    setPendingDeleteId(instanceId);
  };

  const doDelete = async () => {
    if (!pendingDeleteId) return;
    const instanceId = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      const result = await apiFetch<void>(`/api/admin/workshops/instances/${instanceId}`, {
        method: 'DELETE',
      });
      if (result.success) {
        loadInstances();
      } else {
        toast.error(result.error || 'Fehler beim Löschen');
      }
    } catch (err) {
      logger.warn('Failed to delete workshop instance', { error: err, instanceId });
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  };

  const openEditModal = (instance: WorkshopInstanceWithDetails) => {
    setEditingInstance(instance);
    setFormData({
      workshopId: instance.workshop_id,
      startDate: new Date(instance.start_date).toISOString().slice(0, 16),
      endDate: instance.end_date ? new Date(instance.end_date).toISOString().slice(0, 16) : '',
      location: instance.location || '',
      instructor: instance.instructor || '',
      maxParticipants: instance.max_participants?.toString() || '',
      notes: instance.notes || '',
      status: instance.status,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingInstance(null);
    setFormData(initialFormData);
    setError('');
  };

  const getStatusBadge = (status: string) => ({
    label:
      WORKSHOP_INSTANCE_STATUS_LABELS[status as keyof typeof WORKSHOP_INSTANCE_STATUS_LABELS] ??
      status,
    className:
      WORKSHOP_INSTANCE_STATUS_COLORS[status as keyof typeof WORKSHOP_INSTANCE_STATUS_COLORS] ??
      'bg-surface-raised text-text-primary',
  });

  return {
    // Auth
    session,
    sessionStatus,
    // Data
    instances,
    workshops,
    loading: sessionStatus === 'loading' || loading,
    error,
    // Filters
    filters,
    setFilters,
    // Modal
    showCreateModal,
    setShowCreateModal,
    editingInstance,
    formData,
    setFormData,
    submitting,
    // Actions
    handleCreateOrUpdate,
    handleDelete,
    pendingDeleteId,
    doDelete,
    cancelDelete: () => setPendingDeleteId(null),
    openEditModal,
    closeModal,
    getStatusBadge,
  };
}
