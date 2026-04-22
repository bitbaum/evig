import {
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICON_COMPONENTS,
  MEETING_TYPE_TEMPLATES,
} from '@/config/protocols'
import type { MeetingType } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  selectedType: MeetingType | ''
  onSelect: (type: MeetingType) => void
  onReset: () => void
}

export function MeetingTypeStep({ selectedType, onSelect, onReset }: Props) {
  if (selectedType) {
    const IconComponent = MEETING_TYPE_ICON_COMPONENTS[selectedType]
    return (
      <div className="bg-gray-50 rounded-lg border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {IconComponent && <IconComponent className="w-4 h-4 text-gray-500" />}
          <span className="font-medium">{MEETING_TYPE_LABELS[selectedType]}</span>
          <span className="text-gray-400">·</span>
          <span>{MEETING_TYPE_TEMPLATES[selectedType].typical_duration}</span>
        </div>
        <button onClick={onReset} className="text-sm text-blue-600 hover:text-blue-800">
          Ändern
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Heading level={2} className="text-lg text-gray-900">Besprechungstyp wählen</Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.values(MEETING_TYPES).map((type) => {
          const template = MEETING_TYPE_TEMPLATES[type]
          const IconComponent = MEETING_TYPE_ICON_COMPONENTS[type]
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${MEETING_TYPE_COLORS[type].replace('text-', 'text-').split(' ')[0]}`}>
                      <IconComponent className={`w-4 h-4 ${MEETING_TYPE_COLORS[type].split(' ')[1]}`} />
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{MEETING_TYPE_LABELS[type]}</span>
                </div>
                <span className="text-sm text-gray-500">{template.typical_duration}</span>
              </div>
              {template.agenda_hints.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {template.agenda_hints.slice(0, 3).join(' · ')}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
