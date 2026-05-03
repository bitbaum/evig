'use client'

import { X } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function WorkshopTagsSection({ tags, onAddTag, onRemoveTag }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-6">
        Tags (Optional)
      </Heading>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Such-Tags hinzufügen
          </label>
          <input
            type="text"
            placeholder="Tag eingeben und Enter drücken..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddTag((e.target as HTMLInputElement).value.trim())
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Tags helfen Teilnehmern, deinen Workshop zu finden (z.B. &quot;Linux&quot;, &quot;Reparatur&quot;, &quot;Anfänger&quot;)
          </p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-error-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
