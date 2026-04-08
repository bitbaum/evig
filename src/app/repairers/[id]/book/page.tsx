'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  MapPin,
  Star,
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { type RepairerProfile, type AvailabilitySlots } from '@/components/repairers/types'
import { formatPriceCents as formatPrice } from '@/config/marketplace'
import { BookingStepProblem } from '@/components/repairers/BookingStepProblem'
import { BookingStepSchedule } from '@/components/repairers/BookingStepSchedule'
import { BookingStepConfirm } from '@/components/repairers/BookingStepConfirm'
import Heading from '@/components/ui/Heading'

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
          visit_city: isHomeVisit ? visitCity : null,
        }),
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
  const canProceedStep3 = !isHomeVisit || (visitAddress && visitPostalCode && visitCity)

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
          <Heading level={2} className="text-xl text-gray-900 mb-2">{error}</Heading>
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
          <Heading level={2} className="text-2xl text-gray-900 mb-2">Anfrage gesendet!</Heading>
          <p className="text-gray-600 mb-6">
            deine Reparaturanfrage wurde an {repairer?.business_name || 'den Reparateur'} gesendet.
            du erhältst in Kürze eine Bestätigung.
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
          <Heading level={1} className="text-2xl text-gray-900">Reparatur anfragen</Heading>
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
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              <span
                className={`ml-2 hidden sm:inline ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {s === 1 ? 'Problem' : s === 2 ? 'Termin' : 'Details'}
              </span>
              {s < 3 && <ChevronRight className="w-5 h-5 text-gray-400 mx-2 sm:mx-4" />}
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

        {/* Step Content */}
        {step === 1 && (
          <BookingStepProblem
            serviceCategory={serviceCategory}
            setServiceCategory={setServiceCategory}
            deviceInfo={deviceInfo}
            setDeviceInfo={setDeviceInfo}
            description={description}
            setDescription={setDescription}
            urgency={urgency}
            setUrgency={setUrgency}
            onNext={() => setStep(2)}
            canProceed={!!canProceedStep1}
          />
        )}

        {step === 2 && (
          <BookingStepSchedule
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            availability={availability}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && repairer && (
          <BookingStepConfirm
            repairer={repairer}
            serviceCategory={serviceCategory}
            deviceInfo={deviceInfo}
            urgency={urgency}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            isHomeVisit={isHomeVisit}
            setIsHomeVisit={setIsHomeVisit}
            visitAddress={visitAddress}
            setVisitAddress={setVisitAddress}
            visitPostalCode={visitPostalCode}
            setVisitPostalCode={setVisitPostalCode}
            visitCity={visitCity}
            setVisitCity={setVisitCity}
            canProceed={!!canProceedStep3}
            submitting={submitting}
            isAuthenticated={sessionStatus === 'authenticated'}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
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
                  <Heading level={3} className="text-gray-900">{repairer.business_name}</Heading>
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
                    {(repairer.average_rating ?? 0).toFixed(1)} ({repairer.total_reviews})
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
