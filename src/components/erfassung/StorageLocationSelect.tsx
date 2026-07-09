'use client'

/**
 * StorageLocationSelect — pick WHERE a product physically is, from the
 * runtime-addable `storage_locations` list. Replaces the old free-text location
 * input in the erfassung form. Staff can add a location inline ("＋") without
 * leaving the form (POST /api/admin/storage-locations → append → select).
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import {
  STORAGE_LOCATION_KIND_OPTIONS,
  STORAGE_LOCATION_KINDS,
  getStorageLocationKindLabel,
  type StorageLocationKind,
} from '@/config/erfassung/storage-locations'

interface StorageLocationRow {
  id: string
  name: string
  kind: string
  holder_name?: string | null
}

export function StorageLocationSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const t = useTranslations('components.erfassung.storageLocation')
  const [locations, setLocations] = useState<StorageLocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<StorageLocationKind>(STORAGE_LOCATION_KINDS.MAIN_STORAGE)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch<{ locations: StorageLocationRow[] }>('/api/admin/storage-locations')
    if (res.success && res.data) setLocations(res.data.locations)
    else logger.warn('Storage locations load failed', { error: res.error })
    setLoading(false)
  }, [])

  useEffect(() => {
    // Fetch-on-mount; load() sets loading/list state — the legitimate case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    const res = await apiFetch<{ location: StorageLocationRow }>('/api/admin/storage-locations', {
      method: 'POST',
      body: { name, kind: newKind },
    })
    setSaving(false)
    if (res.success && res.data) {
      setLocations(prev => [...prev, res.data!.location])
      onChange(res.data.location.id)
      setNewName('')
      setAdding(false)
    } else {
      logger.warn('Storage location create failed', { error: res.error })
    }
  }

  const optionLabel = (l: StorageLocationRow) => {
    const kind = getStorageLocationKindLabel(l.kind)
    if (l.kind === STORAGE_LOCATION_KINDS.MEMBER_POSSESSION && l.holder_name) {
      return `${l.name} · ${l.holder_name}`
    }
    return `${l.name} · ${kind}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          id="dimension-location"
          className="flex-1"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          aria-label={t('label')}
        >
          <option value="">{loading ? t('loading') : t('placeholder')}</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>
              {optionLabel(l)}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding(a => !a)}
          aria-label={t('addNew')}
          title={t('addNew')}
        >
          {adding ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>

      {adding && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-surface-raised p-2">
          <Input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('newNamePlaceholder')}
            className="min-w-0 flex-1"
            aria-label={t('newNamePlaceholder')}
          />
          <Select
            value={newKind}
            onChange={e => setNewKind(e.target.value as StorageLocationKind)}
            aria-label={t('kindLabel')}
          >
            {STORAGE_LOCATION_KIND_OPTIONS.map(k => (
              <option key={k} value={k}>
                {getStorageLocationKindLabel(k)}
              </option>
            ))}
          </Select>
          <Button type="button" variant="primary" size="sm" onClick={handleAdd} disabled={saving || !newName.trim()}>
            {t('save')}
          </Button>
        </div>
      )}
    </div>
  )
}
