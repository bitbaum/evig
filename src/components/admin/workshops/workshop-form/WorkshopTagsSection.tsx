'use client'

import { X } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'

interface Props {
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function WorkshopTagsSection({ tags, onAddTag, onRemoveTag }: Props) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-6">
      <Heading level={2} className="text-lg text-text-primary mb-6">
        Tags (Optional)
      </Heading>

      <div className="space-y-4">
        <FormField
          label="Such-Tags hinzufügen"
          hint={'Tags helfen Teilnehmern, deinen Workshop zu finden (z.B. "Linux", "Reparatur", "Anfänger")'}
        >
          <Input
            type="text"
            placeholder="Tag eingeben und Enter drücken..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddTag((e.target as HTMLInputElement).value.trim())
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </FormField>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-action-muted text-action rounded-full text-sm"
              >
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveTag(tag)}
                  className="h-auto w-auto p-0 bg-transparent hover:bg-transparent hover:text-error-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
