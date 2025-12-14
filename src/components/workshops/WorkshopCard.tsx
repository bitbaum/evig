import Link from 'next/link'
import React, { useState } from 'react'
import { Calendar, Clock, Users, ArrowRight, Sparkles, CheckCircle2, Briefcase, Rocket, UserCheck, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export interface Workshop {
  title: string
  slug?: string
  description: string
  icon: string
  duration: string
  level: string
  category: string
  isAvailable: boolean
  comingSoon?: boolean
  outcomes?: string[]
}

interface WorkshopCardProps {
  workshop: Workshop
  variant: 'available' | 'coming-soon'
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, variant }) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'registering' | 'registered' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')


  const isAvailable = variant === 'available'
  const categoryColor = isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'

  const handleRegistration = async () => {
    if (status === 'loading') {
      // Session is still loading, do nothing
      return
    }

    if (!session?.user) {
      // Redirect to login
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationStatus('registering')
    setErrorMessage('')

    try {
      const response = await fetch('/api/workshops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshopSlug: workshop.slug || workshop.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          // For now, we'll register for the workshop itself, not a specific instance
          // In the future, this could be expanded to allow instance selection
        }),
      })

      if (response.ok) {
        setRegistrationStatus('registered')
      } else {
        const error = await response.text()
        setRegistrationStatus('error')
        setErrorMessage(error || 'Registrierung fehlgeschlagen')
      }
    } catch (error) {
      setRegistrationStatus('error')
      setErrorMessage('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <div className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
          {workshop.icon}
        </div>
        <div className="text-sm">
          <span className={`inline-block ${categoryColor} px-2 py-1 rounded-full text-xs font-medium mb-2`}>
            {workshop.category}
          </span>
          <div className="text-gray-500">
            <span className="block">{workshop.duration}</span>
            <span className="block">{workshop.level}</span>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-3 group-hover:text-green-600 transition-colors duration-300">
        {workshop.title}
      </h3>
      
      <p className="text-gray-600 mb-4 flex-grow">{workshop.description}</p>
      
      {workshop.outcomes && isAvailable && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 text-green-500 mr-2" />
Was Sie lernen werden:
          </h4>
          <ul className="space-y-2">
            {workshop.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
        {isAvailable ? (
          <>
            {status === 'loading' ? (
              <div className="inline-flex items-center text-gray-500 font-semibold">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Laden...
              </div>
            ) : registrationStatus === 'registered' ? (
              <div className="inline-flex items-center text-green-600 font-semibold">
                <UserCheck className="w-4 h-4 mr-1" />
                Angemeldet
              </div>
            ) : registrationStatus === 'registering' ? (
              <div className="inline-flex items-center text-gray-500 font-semibold">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Wird angemeldet...
              </div>
            ) : !session?.user ? (
              <button
                onClick={() => window.location.href = '/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname)}
                className="inline-flex items-center text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-1 transition-transform duration-300"
              >
                Anmelden
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleRegistration}
                className="inline-flex items-center text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-1 transition-transform duration-300 disabled:opacity-50"
                disabled={['registering', 'registered'].includes(registrationStatus)}
              >
                Anmelden
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
            {registrationStatus === 'error' && (
              <div className="text-xs text-red-600 mt-1">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <button
            className="inline-flex items-center text-gray-500 font-medium cursor-not-allowed"
            disabled
          >
Bald verfügbar
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
        <span className="text-sm text-gray-500">
          {isAvailable ? 'Nächste Sitzung: Auf Anfrage' : 'Bleiben Sie dran!'}
        </span>
      </div>
    </div>
  )
} 