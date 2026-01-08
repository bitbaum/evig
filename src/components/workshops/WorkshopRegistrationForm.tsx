'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface Workshop {
  id: string
  slug: string
  title: string
  max_participants: number
  price_cents: number
}

interface WorkshopInstance {
  id: string
  start_date: string
  location: string
  status: string
  current_participants: number
}

interface WorkshopRegistrationFormProps {
  workshop: Workshop
  instance: WorkshopInstance
}

export default function WorkshopRegistrationForm({ workshop, instance }: WorkshopRegistrationFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationStatus] = useState<'checking' | 'not-registered' | 'registered' | 'registering' | 'error'>('checking')
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetch(`/api/workshops/registration/${instance.id}`)
        const data = await response.json()

        if (data.registered) {
          setRegistrationStatus('registered')
          setRegistrationData(data.registration)
        } else {
          setRegistrationStatus('not-registered')
        }
      } catch (err) {
        logger.error('Error checking registration', { error: err })
        setRegistrationStatus('error')
        setError('Fehler beim Laden des Anmeldestatus')
      }
    }

    if (session?.user) {
      checkRegistrationStatus()
    } else if (status !== 'loading') {
      // Defer setState to avoid synchronous update during effect
      const frame = requestAnimationFrame(() => setRegistrationStatus('not-registered'))
      return () => cancelAnimationFrame(frame)
    }
  }, [session, status, instance.id])

  const handleRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationStatus('registering')
    setError('')

    try {
      const response = await fetch('/api/workshops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshopSlug: workshop.slug
        })
      })

      const data = await response.json()

      if (data.success) {
        setRegistrationStatus('registered')
        setRegistrationData({
          id: data.registrationId,
          status: 'pending',
          registered_at: new Date().toISOString(),
          workshop_instance: {
            start_date: instance.start_date,
            location: instance.location,
            workshop_title: workshop.title,
            workshop_slug: workshop.slug
          }
        })

        // Redirect to dashboard after success
        setTimeout(() => {
          router.push('/dashboard/workshops')
        }, 2000)
      } else {
        setRegistrationStatus('error')
        setError(data.error || 'Anmeldung fehlgeschlagen')
      }
    } catch (err) {
      setRegistrationStatus('error')
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const isFull = instance.current_participants >= workshop.max_participants
  const spotsLeft = workshop.max_participants - instance.current_participants

  if (status === 'loading' || registrationStatus === 'checking') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
        <p className="text-gray-600">Lade Anmeldestatus...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Für Workshop anmelden</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-blue-800 mb-2">
            <LogIn className="w-5 h-5 mr-2" />
            <span className="font-medium">Anmeldung erforderlich</span>
          </div>
          <p className="text-blue-700 text-sm">
            Bitte melden Sie sich an, um sich für diesen Workshop anzumelden.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Anmelden
          </Link>

          <Link
            href="/auth/register"
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Neues Konto erstellen
          </Link>
        </div>
      </div>
    )
  }

  if (registrationStatus === 'registered') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop-Anmeldung</h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-green-800 mb-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Erfolgreich angemeldet!</span>
          </div>
          <p className="text-green-700 text-sm">
            Sie sind für diesen Workshop angemeldet. Details finden Sie in Ihrem Dashboard.
          </p>
        </div>

        <Link
          href="/dashboard/workshops"
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    )
  }

  if (isFull) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop ausgebucht</h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-red-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Keine Plätze mehr verfügbar</span>
          </div>
          <p className="text-red-700 text-sm">
            Dieser Workshop ist bereits ausgebucht. Schauen Sie regelmäßig vorbei für neue Termine.
          </p>
        </div>

        <button
          disabled
          className="w-full px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Ausgebucht
        </button>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Für Workshop anmelden</h3>

      {/* Workshop Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span>{new Date(instance.start_date).toLocaleDateString('de-CH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span>{instance.location}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 text-gray-400 mr-2" />
            <span>{spotsLeft} Plätze verfügbar</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-green-600">
          {workshop.price_cents === 0 ? 'Kostenlos' : `CHF ${(workshop.price_cents / 100).toFixed(0)}`}
        </div>
        {workshop.price_cents > 0 && (
          <div className="text-sm text-gray-500">zzgl. MwSt.</div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Registration Button */}
      <button
        onClick={handleRegistration}
        disabled={registrationStatus === 'registering'}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {registrationStatus === 'registering' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Wird angemeldet...
          </>
        ) : (
          'Für Workshop anmelden'
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Sie erhalten eine Bestätigungs-E-Mail mit allen Details.
      </p>
    </div>
  )
}