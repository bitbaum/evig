'use client'

import { type AvailabilitySlots } from './types'
import { getAvailableDates } from './helpers'
import { formatWeekdayShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface BookingStepScheduleProps {
  selectedDate: string
  setSelectedDate: (v: string) => void
  selectedTime: string
  setSelectedTime: (v: string) => void
  availability: AvailabilitySlots
  onBack: () => void
  onNext: () => void
}

export function BookingStepSchedule({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  availability,
  onBack,
  onNext,
}: BookingStepScheduleProps) {
  const dates = getAvailableDates()

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <Heading level={2} className="text-lg font-semibold text-gray-900 mb-2">Wunschtermin wählen</Heading>
      <p className="text-gray-600 text-sm mb-6">
        Optional - der Reparateur wird dir verfügbare Termine vorschlagen
      </p>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Datum</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {dates.map((date) => {
            const dateObj = new Date(date)
            const hasSlots = availability[date]?.some((s) => s.available)

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date)
                  setSelectedTime('')
                }}
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedDate === date
                    ? 'border-blue-600 bg-blue-50'
                    : hasSlots
                      ? 'border-gray-200 hover:border-blue-300'
                      : 'border-gray-100 bg-gray-50 text-gray-400'
                }`}
              >
                <div className="text-xs text-gray-500">
                  {formatWeekdayShort(dateObj)}
                </div>
                <div className="font-medium">{dateObj.getDate()}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && availability[selectedDate] && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Uhrzeit</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {availability[selectedDate].map((slot, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => slot.available && setSelectedTime(slot.start_time.slice(0, 5))}
                disabled={!slot.available}
                className={`p-2 rounded-lg border text-sm transition-all ${
                  selectedTime === slot.start_time.slice(0, 5)
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : slot.available
                      ? 'border-gray-200 hover:border-blue-300'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {slot.start_time.slice(0, 5)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate &&
        (!availability[selectedDate] || availability[selectedDate].length === 0) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Für dieses Datum sind keine spezifischen Zeitfenster hinterlegt. Der Reparateur wird
              dir einen Termin vorschlagen.
            </p>
          </div>
        )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}
