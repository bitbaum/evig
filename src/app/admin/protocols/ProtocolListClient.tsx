'use client'

/**
 * Protocol List Filters Client Component
 *
 * Client-side filter dropdowns and search for protocol list.
 * Created: 2026-02-10
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import {
  MEETING_TYPE_LABELS,
  PROTOCOL_STATUS_LABELS,
} from '@/config/protocols'

export default function ProtocolListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/protocols?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400" />

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            className="text-sm border rounded px-2 py-1 w-48"
            defaultValue={searchParams.get('q') || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilterChange('q', (e.target as HTMLInputElement).value)
              }
            }}
            onBlur={(e) => {
              const currentQ = searchParams.get('q') || ''
              if (e.target.value !== currentQ) {
                handleFilterChange('q', e.target.value)
              }
            }}
          />
        </div>

        {/* Meeting type filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Typ:</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={searchParams.get('meeting_type') || ''}
            onChange={(e) => handleFilterChange('meeting_type', e.target.value)}
          >
            <option value="">Alle</option>
            {Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={searchParams.get('status') || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Alle</option>
            {Object.entries(PROTOCOL_STATUS_LABELS).map(([key, label]) => (
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
