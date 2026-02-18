'use client'

/**
 * Task Filters Client Component
 *
 * Client-side filter dropdowns and search for task list.
 * Created: 2026-02-05
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/config/tasks'

export default function TaskFiltersClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

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
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when any filter changes
    params.delete('page')
    router.push(`/admin/tasks?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Aufgaben suchen..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Kategorie:</label>
            <select
              className="text-sm border rounded px-2 py-1"
              value={searchParams.get('category') || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              className="text-sm border rounded px-2 py-1"
              value={searchParams.get('status') || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Priorität:</label>
            <select
              className="text-sm border rounded px-2 py-1"
              value={searchParams.get('priority') || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
