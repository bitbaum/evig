'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Ungültiger Verifizierungslink. Token fehlt.')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          const data = await response.json()
          setStatus('success')
          setMessage(data.message)

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login?verified=true')
          }, 3000)
        } else {
          const error = await response.json()
          setStatus('error')
          setMessage(error.error || 'Verifizierung fehlgeschlagen')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          E-Mail-Adresse bestätigen
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Wir bestätigen Ihre E-Mail-Adresse...
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">E-Mail-Adresse wird bestätigt...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  E-Mail-Adresse bestätigt!
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500">
                  Sie werden in wenigen Sekunden zur Anmeldung weitergeleitet...
                </p>
                <div className="mt-6">
                  <Link
                    href="/auth/login"
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Jetzt anmelden →
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Verifizierung fehlgeschlagen
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Zur Anmeldung
                  </Link>
                  <div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-green-600 hover:text-green-500 text-sm"
                    >
                      Erneut versuchen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          E-Mail-Adresse bestätigen
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}






