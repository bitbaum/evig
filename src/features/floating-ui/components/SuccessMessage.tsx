/**
 * Success message shown after a suggestion is submitted.
 * Pure presentational component, no props needed.
 */
import Heading from '@/components/ui/Heading'

export function SuccessMessage() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <Heading level={3} className="font-semibold text-gray-900 mb-2">Vielen Dank!</Heading>
      <p className="text-sm text-gray-600 mb-4">Ihr Vorschlag wurde erfolgreich gesendet.</p>
      <div className="text-xs text-gray-500">
        Wir werden uns schnellstmöglich darum kümmern.
      </div>
    </div>
  )
}
