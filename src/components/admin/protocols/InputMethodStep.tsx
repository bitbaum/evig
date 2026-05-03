import {
  INPUT_METHODS,
  INPUT_METHOD_LABELS,
  INPUT_METHOD_DESCRIPTIONS,
  INPUT_METHOD_ICON_COMPONENTS,
} from '@/config/protocols'
import type { InputMethod } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  selectedMethod: InputMethod | ''
  onSelect: (method: InputMethod) => void
  onReset: () => void
}

export function InputMethodStep({ selectedMethod, onSelect, onReset }: Props) {
  if (selectedMethod) {
    const IconComponent = INPUT_METHOD_ICON_COMPONENTS[selectedMethod]
    return (
      <div className="bg-neutral-50 rounded-lg border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          {IconComponent && <IconComponent className="w-4 h-4 text-neutral-500" />}
          <span className="font-medium">{INPUT_METHOD_LABELS[selectedMethod]}</span>
        </div>
        <button onClick={onReset} className="text-sm text-blue-600 hover:text-blue-800">
          Ändern
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Heading level={2} className="text-lg text-neutral-900">Eingabemethode wählen</Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.values(INPUT_METHODS).map((method) => {
          const IconComponent = INPUT_METHOD_ICON_COMPONENTS[method]
          return (
            <button
              key={method}
              onClick={() => onSelect(method)}
              className="text-left p-4 bg-white border-2 border-neutral-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-medium text-neutral-900">{INPUT_METHOD_LABELS[method]}</span>
                  <p className="text-sm text-neutral-500 mt-0.5">{INPUT_METHOD_DESCRIPTIONS[method]}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
