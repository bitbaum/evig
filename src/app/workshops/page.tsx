'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
  Code,
  HardDrive,
  Globe,
  Bitcoin,
  Brain
} from 'lucide-react'

interface Workshop {
  id: string
  slug: string
  title: string
  description: string
  category: string
  duration: string
  level: string
  max_participants: number
  price_cents: number
  is_active: boolean
  created_at: string
}

interface WorkshopInstance {
  id: string
  workshop_id: string
  start_date: string
  location: string
  status: string
  current_participants: number
}

interface WorkshopWithInstances extends Workshop {
  instances: WorkshopInstance[]
  user_registered?: boolean
}

export default function WorkshopsPage() {
  const { data: session } = useSession()
  const [workshops, setWorkshops] = useState<WorkshopWithInstances[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchWorkshops()
  }, [session])

  const fetchWorkshops = async () => {
    try {
      // Fetch workshops
      const workshopsResponse = await fetch('/api/workshops')
      const workshopsData = await workshopsResponse.json()

      if (workshopsData.success) {
        // Fetch instances for each workshop
        const workshopsWithInstances = await Promise.all(
          workshopsData.workshops.map(async (workshop: Workshop) => {
            try {
              const instancesResponse = await fetch(`/api/workshops/${workshop.slug}/instances`)
              const instancesData = await instancesResponse.json()

              let userRegistered = false
              if (session?.user && instancesData.success) {
                // Check if user is registered for any instance
                for (const instance of instancesData.instances) {
                  const registrationResponse = await fetch(`/api/workshops/registration/${instance.id}`)
                  const registrationData = await registrationResponse.json()
                  if (registrationData.registered) {
                    userRegistered = true
                    break
                  }
                }
              }

              return {
                ...workshop,
                instances: instancesData.success ? instancesData.instances : [],
                user_registered: userRegistered
              }
            } catch (error) {
              logger.error(`Error fetching instances for ${workshop.slug}`, { error })
              return { ...workshop, instances: [], user_registered: false }
            }
          })
        )

        setWorkshops(workshopsWithInstances)
      }
    } catch (error) {
      logger.error('Error fetching workshops', { error })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'betriebssysteme': return BookOpen
      case 'entwicklung': return Code
      case 'hardware': return HardDrive
      case 'web': return Globe
      case 'blockchain': return Bitcoin
      case 'ki & ml': return Brain
      default: return BookOpen
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'anfänger': return 'bg-green-100 text-green-800'
      case 'fortgeschrittene': return 'bg-blue-100 text-blue-800'
      case 'alle stufen': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredWorkshops = workshops.filter(workshop => {
    if (filter === 'all') return true
    return workshop.category.toLowerCase().includes(filter.toLowerCase())
  })

  const categories = ['all', ...Array.from(new Set(workshops.map(w => w.category)))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RevampIT Workshops
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Erweitere dein Wissen in nachhaltiger Technologie. Von Linux über Open-Source bis hin zu Blockchain und KI.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === category
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'Alle Workshops' : category}
            </button>
          ))}
        </div>

        {/* Workshops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWorkshops.map((workshop) => {
            const IconComponent = getCategoryIcon(workshop.category)
            const nextInstance = workshop.instances.find(inst => new Date(inst.start_date) > new Date())

            return (
              <div key={workshop.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Workshop Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(workshop.level)}`}>
                      {workshop.level}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {workshop.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {workshop.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {workshop.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Max {workshop.max_participants}
                    </div>
                  </div>
                </div>

                {/* Workshop Details */}
                <div className="p-6">
                  {nextInstance ? (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Nächster Termin: {new Date(nextInstance.start_date).toLocaleDateString('de-CH')}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{nextInstance.location}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-orange-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Termin folgt in Kürze</span>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      {workshop.price_cents === 0 ? 'Kostenlos' : `CHF ${(workshop.price_cents / 100).toFixed(0)}`}
                    </span>
                    {workshop.user_registered && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Angemeldet
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/workshops/${workshop.slug}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
                    >
                      Details
                    </Link>

                    {workshop.user_registered ? (
                      <Link
                        href="/dashboard/workshops"
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                      >
                        Verwalten
                      </Link>
                    ) : nextInstance ? (
                      <Link
                        href={`/workshops/${workshop.slug}/register`}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                      >
                        Anmelden
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed text-center text-sm font-medium"
                      >
                        Ausgebucht
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {filteredWorkshops.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Workshops gefunden
            </h3>
            <p className="text-gray-600">
              Versuche andere Filter oder schaue später wieder vorbei.
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Workshop vorschlagen?
          </h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Hast du eine Idee für einen Workshop? Wir freuen uns über deine Vorschläge für neue Themen und Inhalte.
          </p>
          <Link
            href="/contact?subject=Workshop%20Vorschlag"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Workshop vorschlagen
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}