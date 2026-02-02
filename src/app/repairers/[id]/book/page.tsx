'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  User,
  CheckCircle,
  AlertCircle,
  Wrench,
  Home,
  Building,
  ChevronRight,
  Loader2
} from 'lucide-react'

interface RepairerProfile {
  id: string
  business_name: string | null
  business_type: string
  city: string
  postal_code: string
  average_rating: number
  total_reviews: number
  is_verified: boolean
  services_offered: string[]
  hourly_rate_cents: number | null
  home_visit_fee_cents: number | null
}

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
}

interface AvailabilitySlots {
  [date: string]: TimeSlot[]
}

const SERVICE_CATEGORIES = [
  { value: 'laptop_repair', label: 'Laptop-Reparatur', icon: '💻' },
  { value: 'phone_repair', label: 'Smartphone-Reparatur', icon: '📱' },
  { value: 'tablet_repair', label: 'Tablet-Reparatur', icon: '📱' },
  { value: 'desktop_repair', label: 'Desktop-PC Reparatur', icon: '🖥️' },
  { value: 'console_repair', label: 'Spielkonsole Reparatur', icon: '🎮' },
  { value: 'audio_repair', label: 'Audio-Geräte Reparatur', icon: '🔊' },
  { value: 'other', label: 'Anderes Gerät', icon: '🔧' }
]

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Niedrig', description: 'Innerhalb von 1-2 Wochen' },
  { value: 'normal', label: 'Normal', description: 'Innerhalb einer Woche' },
  { value: 'high', label: 'Dringend', description: 'So schnell wie möglich' },
  { value: 'emergency', label: 'Notfall', description: 'Heute/Morgen (Aufpreis)' }
]

export default function BookRepairerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  const [repairer, setRepairer] = useState<RepairerProfile | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlots>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  // Form state
  const [step, setStep] = useState(1)
  const [serviceCategory, setServiceCategory] = useState('')
  const [description, setDescription] = useState('')
  const [deviceInfo, setDeviceInfo] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isHomeVisit, setIsHomeVisit] = useState(false)
  const [visitAddress, setVisitAddress] = useState('')
  const [visitPostalCode, setVisitPostalCode] = useState('')
  const [visitCity, setVisitCity] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/repairers/${id}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'Reparateur nicht gefunden')
          return
        }

        setRepairer(data.repairer)
      } catch (err) {
        logger.error('Error fetching repairer', { error: err })
        setError('Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (selectedDate || step === 2) {
      const fetchSlots = async () => {
        try {
          const startDate = selectedDate || new Date().toISOString().split('T')[0]
          const response = await fetch(
            `/api/repairers/${id}/availability?start_date=${startDate}`
          )
          const data = await response.json()

          if (data.success) {
            setAvailability(data.slots || {})
          }
        } catch (err) {
          logger.error('Error fetching availability', { error: err })
        }
      }
      fetchSlots()
    }
  }, [id, selectedDate, step])

  const handleSubmit = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/repairers/${id}/book`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/repairers/${id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_category: serviceCategory,
          description,
          device_info: deviceInfo || null,
          preferred_date: selectedDate || null,
          preferred_time: selectedTime || null,
          urgency,
          is_home_visit: isHomeVisit,
          visit_address: isHomeVisit ? visitAddress : null,
          visit_postal_code: isHomeVisit ? visitPostalCode : null,
          visit_city: isHomeVisit ? visitCity : null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Buchung fehlgeschlagen')
        return
      }

      setSuccess(true)
      setAppointmentId(data.appointment?.id)

    } catch (err) {
      logger.error('Error booking appointment', { error: err })
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceedStep1 = serviceCategory && description.length >= 10
  const canProceedStep2 = true // Date/time is optional
  const canProceedStep3 = !isHomeVisit || (visitAddress && visitPostalCode && visitCity)

  const formatPrice = (cents: number | null) => {
    if (!cents) return null
    return `CHF ${(cents / 100).toFixed(0)}`
  }

  // Get next 14 days for date selection
  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Buchungsformular...</p>
        </div>
      </div>
    )
  }

  if (error && !repairer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <Link href="/repairers" className="text-blue-600 hover:underline">
            Zurück zur Suche
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Anfrage gesendet!
          </h2>
          <p className="text-gray-600 mb-6">
            Ihre Reparaturanfrage wurde an {repairer?.business_name || 'den Reparateur'} gesendet.
            Sie erhalten in Kürze eine Bestätigung.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard/appointments"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Meine Termine ansehen
            </Link>
            <Link
              href="/repairers"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Weitere Reparateure finden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/repairers/${id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Profil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reparatur anfragen</h1>
          {repairer && (
            <p className="text-gray-600 mt-1">
              bei {repairer.business_name || 'Reparateur'} in {repairer.city}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              <span className={`ml-2 hidden sm:inline ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                {s === 1 ? 'Problem' : s === 2 ? 'Termin' : 'Details'}
              </span>
              {s < 3 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-2 sm:mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Problem Description */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Beschreiben Sie Ihr Problem
            </h2>

            {/* Service Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gerätekategorie *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setServiceCategory(cat.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      serviceCategory === cat.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Info */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geräteinformationen (optional)
              </label>
              <input
                type="text"
                value={deviceInfo}
                onChange={(e) => setDeviceInfo(e.target.value)}
                placeholder="z.B. MacBook Pro 2020, iPhone 13, Samsung Galaxy S22..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problembeschreibung *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Beschreiben Sie das Problem so detailliert wie möglich..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Mindestens 10 Zeichen ({description.length}/10)
              </p>
            </div>

            {/* Urgency */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dringlichkeit
              </label>
              <div className="grid grid-cols-2 gap-3">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgency(opt.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      urgency === opt.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900 block">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Wunschtermin wählen
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Optional - der Reparateur wird Ihnen verfügbare Termine vorschlagen
            </p>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Datum
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {getAvailableDates().map((date) => {
                  const dateObj = new Date(date)
                  const hasSlots = availability[date]?.some(s => s.available)

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
                        {dateObj.toLocaleDateString('de-CH', { weekday: 'short' })}
                      </div>
                      <div className="font-medium">
                        {dateObj.getDate()}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && availability[selectedDate] && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Uhrzeit
                </label>
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

            {selectedDate && (!availability[selectedDate] || availability[selectedDate].length === 0) && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Für dieses Datum sind keine spezifischen Zeitfenster hinterlegt.
                  Der Reparateur wird Ihnen einen Termin vorschlagen.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Confirm */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Reparaturort & Bestätigung
            </h2>

            {/* Location Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Wo soll die Reparatur stattfinden?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsHomeVisit(false)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    !isHomeVisit
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building className="w-6 h-6 text-gray-600 mb-2" />
                  <span className="font-medium text-gray-900 block">Beim Reparateur</span>
                  <span className="text-sm text-gray-500">
                    {repairer?.city}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHomeVisit(true)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isHomeVisit
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Home className="w-6 h-6 text-gray-600 mb-2" />
                  <span className="font-medium text-gray-900 block">Hausbesuch</span>
                  <span className="text-sm text-gray-500">
                    {repairer?.home_visit_fee_cents
                      ? `+${formatPrice(repairer.home_visit_fee_cents)}`
                      : 'Auf Anfrage'}
                  </span>
                </button>
              </div>
            </div>

            {/* Home Visit Address */}
            {isHomeVisit && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Ihre Adresse</h3>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Strasse & Hausnummer *</label>
                  <input
                    type="text"
                    value={visitAddress}
                    onChange={(e) => setVisitAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">PLZ *</label>
                    <input
                      type="text"
                      value={visitPostalCode}
                      onChange={(e) => setVisitPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Ort *</label>
                    <input
                      type="text"
                      value={visitCity}
                      onChange={(e) => setVisitCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Zusammenfassung</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Reparateur:</dt>
                  <dd className="font-medium">{repairer?.business_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Kategorie:</dt>
                  <dd className="font-medium">
                    {SERVICE_CATEGORIES.find(c => c.value === serviceCategory)?.label}
                  </dd>
                </div>
                {deviceInfo && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Gerät:</dt>
                    <dd className="font-medium">{deviceInfo}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Dringlichkeit:</dt>
                  <dd className="font-medium">
                    {URGENCY_OPTIONS.find(u => u.value === urgency)?.label}
                  </dd>
                </div>
                {selectedDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Wunschtermin:</dt>
                    <dd className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('de-CH', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                      {selectedTime && ` um ${selectedTime}`}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Ort:</dt>
                  <dd className="font-medium">
                    {isHomeVisit ? 'Hausbesuch' : `Beim Reparateur (${repairer?.city})`}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Login Notice */}
            {sessionStatus !== 'authenticated' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium">Anmeldung erforderlich</p>
                  <p className="text-yellow-700 text-sm">
                    Sie werden zur Anmeldung weitergeleitet, um die Anfrage abzuschliessen.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canProceedStep3 || submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  'Anfrage senden'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Repairer Info Sidebar */}
        {repairer && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{repairer.business_name}</h3>
                  {repairer.is_verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {repairer.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    {repairer.average_rating.toFixed(1)} ({repairer.total_reviews})
                  </span>
                </div>
              </div>
              {repairer.hourly_rate_cents && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">ab</div>
                  <div className="font-semibold text-gray-900">
                    {formatPrice(repairer.hourly_rate_cents)}/Std
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
