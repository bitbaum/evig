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
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-neutral-50">
        <Heading level={2} className="text-lg text-neutral-900">
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
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
              <span className="font-medium text-neutral-900">{topic.title}</span>
            </button>
            {expandedTopics.has(topic.id) && (
              <div className="mt-3 ml-6 space-y-2">
                <p className="text-neutral-700 text-sm">{topic.discussion}</p>
                {topic.outcome && (
                  <div className="bg-primary-50 border border-primary-200 rounded p-2">
                    <p className="text-sm text-primary-800">
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
