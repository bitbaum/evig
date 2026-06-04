'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/config/tasks'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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
              value={searchParams.get('status') || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Alle</option>
              {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
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
