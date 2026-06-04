import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface Props {
  topics: StructuredNotes['topics']
  expandedTopics: Set<string>
  onToggleTopic: (id: string) => void
}

export function ProtocolTopicsSection({ topics, expandedTopics, onToggleTopic }: Props) {
  if (!topics || topics.length === 0) return null

  return (
    <div className="bg-surface-base rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-surface-raised">
        <Heading level={2} className="text-lg text-text-primary">
          Themen ({topics.length})
        </Heading>
      </div>
      <div className="divide-y">
        {topics.map((topic) => (
          <div key={topic.id} className="p-4">
            <button
              onClick={() => onToggleTopic(topic.id)}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedTopics.has(topic.id) ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              <span className="font-medium text-text-primary">{topic.title}</span>
            </button>
            {expandedTopics.has(topic.id) && (
              <div className="mt-3 ml-6 space-y-2">
                <p className="text-text-secondary text-sm">{topic.discussion}</p>
                {topic.outcome && (
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 rounded-sm p-2">
                    <p className="text-sm text-primary-800 dark:text-primary-300">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      Ergebnis: {topic.outcome}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
