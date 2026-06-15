'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import {
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_LIST_FILTERS,
  TASK_LIST_FILTER_LABELS,
  TASK_LIST_FILTER_STORAGE_KEY,
  TASK_LIST_DEFAULT_FILTER,
  TASK_STATUSES,
} from '@/config/tasks'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: TASK_LIST_FILTERS.ALL, label: TASK_LIST_FILTER_LABELS[TASK_LIST_FILTERS.ALL] },
  { value: TASK_LIST_FILTERS.ACTION_NEEDED, label: TASK_LIST_FILTER_LABELS[TASK_LIST_FILTERS.ACTION_NEEDED] },
  { value: TASK_STATUSES.NEEDS_ATTENTION, label: TASK_LIST_FILTER_LABELS[TASK_STATUSES.NEEDS_ATTENTION] },
  { value: TASK_STATUSES.REQUESTED, label: TASK_LIST_FILTER_LABELS[TASK_STATUSES.REQUESTED] },
  { value: TASK_STATUSES.IN_PROGRESS, label: TASK_LIST_FILTER_LABELS[TASK_STATUSES.IN_PROGRESS] },
  { value: TASK_STATUSES.IDLE, label: TASK_LIST_FILTER_LABELS[TASK_STATUSES.IDLE] },
]

function persistStatusFilter(value: string) {
  try {
    localStorage.setItem(TASK_LIST_FILTER_STORAGE_KEY, value)
  } catch {
    // Private browsing / storage blocked — URL remains SSOT for this session.
  }
}

function readStoredStatusFilter(): string | null {
  try {
    return localStorage.getItem(TASK_LIST_FILTER_STORAGE_KEY)
  } catch {
    return null
  }
}

export default function TaskFiltersClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  const statusFromUrl = searchParams.get('status')
  const statusValue = statusFromUrl ?? TASK_LIST_DEFAULT_FILTER

  // Y.4: sync bare `/admin/tasks` with persisted filter preference (localStorage).
  useEffect(() => {
    if (searchParams.has('status')) return

    const saved = readStoredStatusFilter()
    const target = saved ?? TASK_LIST_DEFAULT_FILTER

    if (!saved) {
      persistStatusFilter(TASK_LIST_DEFAULT_FILTER)
    }

    if (target === TASK_LIST_DEFAULT_FILTER) {
      router.replace(`/admin/tasks?status=${TASK_LIST_DEFAULT_FILTER}`)
      return
    }

    router.replace(`/admin/tasks?status=${encodeURIComponent(target)}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep localStorage aligned when status changes via stat-card links or back/forward.
  useEffect(() => {
    const status = searchParams.get('status')
    if (status) persistStatusFilter(status)
  }, [searchParams])

  // Debounced search — resets to page 1 on query change
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) {
        params.set('q', searchValue)
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.push(`/admin/tasks?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'status') {
      persistStatusFilter(value || TASK_LIST_FILTERS.ALL)
      if (value) {
        params.set('status', value)
      } else {
        params.delete('status')
      }
    } else if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/admin/tasks?${params.toString()}`)
  }

  return (
    <div className="bg-surface-base rounded-lg border dark:border-white/8 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Aufgaben suchen..."
            className="pl-9 py-1.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
          <Filter className="w-5 h-5 text-text-tertiary shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-sm text-text-secondary shrink-0">Kategorie:</label>
            <Select
              className="py-1 text-sm"
              value={searchParams.get('category') || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-sm text-text-secondary shrink-0">Status:</label>
            <Select
              className="py-1 text-sm"
              value={statusValue}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-sm text-text-secondary shrink-0">Priorität:</label>
            <Select
              className="py-1 text-sm"
              value={searchParams.get('priority') || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
