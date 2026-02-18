import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
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
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          Themen ({topics.length})
        </h2>
      </div>
      <div className="divide-y">
        {topics.map((topic) => (
          <div key={topic.id} className="p-4">
            <button
              onClick={() => onToggleTopic(topic.id)}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedTopics.has(topic.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium text-gray-900">{topic.title}</span>
            </button>
            {expandedTopics.has(topic.id) && (
              <div className="mt-3 ml-6 space-y-2">
                <p className="text-gray-700 text-sm">{topic.discussion}</p>
                {topic.outcome && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-sm text-green-800">
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
