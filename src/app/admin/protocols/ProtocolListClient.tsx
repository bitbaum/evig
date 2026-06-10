'use client'

/**
 * Protocol List Filters Client Component
 *
 * Client-side filter dropdowns and search for protocol list.
 * Created: 2026-02-10
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Filter, Search } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  MEETING_TYPE_LABELS,
  PROTOCOL_STATUS_LABELS,
} from '@/config/protocols'
import { PROTOCOL_WORKFLOW_STEPS } from '@/lib/protocols/workflow'

interface ProtocolListClientProps {
  teamMembers: Array<{ id: string; name: string }>
}

export default function ProtocolListClient({ teamMembers }: ProtocolListClientProps) {
  const t = useTranslations('admin.protocols.filters')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when any filter changes
    params.delete('page')
    router.push(`/admin/protocols?${params.toString()}`)
  }

  return (
    <div className="bg-surface-base rounded-lg border p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Filter className="w-5 h-5 text-text-tertiary" />

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-48"
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
          <label className="text-sm text-text-secondary">{t('typeLabel')}</label>
          <Select
            className="w-auto"
            value={searchParams.get('meeting_type') || ''}
            onChange={(e) => handleFilterChange('meeting_type', e.target.value)}
          >
            <option value="">{t('all')}</option>
            {Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t('statusLabel')}</label>
          <Select
            className="w-auto"
            value={searchParams.get('status') || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">{t('all')}</option>
            {Object.entries(PROTOCOL_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {/* Workflow step filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t('stepLabel')}</label>
          <Select
            className="w-auto"
            value={searchParams.get('step') || ''}
            onChange={(e) => handleFilterChange('step', e.target.value)}
          >
            <option value="">{t('all')}</option>
            {PROTOCOL_WORKFLOW_STEPS.map((step, index) => (
              <option key={step.id} value={step.id}>
                {index + 1}) {step.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Attendee filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t('attendeeLabel')}</label>
          <Select
            className="w-auto"
            value={searchParams.get('attendee') || ''}
            onChange={(e) => handleFilterChange('attendee', e.target.value)}
          >
            <option value="">{t('all')}</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
