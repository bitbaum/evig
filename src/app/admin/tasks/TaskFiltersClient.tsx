'use client'

/**
 * Task Filters Client Component
 *
 * Client-side filter dropdowns for task list.
 * Created: 2026-02-05
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
} from '@/config/tasks'

export default function TaskFiltersClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('category', value)
    } else {
      params.delete('category')
    }
    router.push(`/admin/tasks?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`/admin/tasks?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Kategorie:</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={searchParams.get('category') || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
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
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Alle</option>
            {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
