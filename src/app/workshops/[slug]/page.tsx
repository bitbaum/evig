import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { formatDateWithWeekday } from '@/lib/date-formats'
import { TABLE_NAMES } from '@/config/database'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Award,
  Star
} from 'lucide-react'
import WorkshopRegistrationForm from '@/components/workshops/WorkshopRegistrationForm'
import WorkshopReviews from '@/components/workshops/WorkshopReviews'
import WorkshopMaterials from '@/components/workshops/WorkshopMaterials'
import type { Workshop, WorkshopInstanceWithCount } from '@/components/workshops/types'

// DB row type - COUNT returns string, needs conversion
interface WorkshopInstanceRow {
  id: string
  workshop_id: string
  start_date: string
  end_date: string | null
  location: string | null
  instructor: string | null
  max_participants: number | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  current_participants: string  // COUNT returns string
}

async function getWorkshop(slug: string): Promise<Workshop | null> {
  try {
    const result = await query(
      `SELECT * FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    return (result.rows[0] as Workshop) || null
  } catch (error) {
    logger.error('Error fetching workshop', { error })
    return null
  }
}

async function getWorkshopInstances(workshopId: string): Promise<WorkshopInstanceWithCount[]> {
  try {
    const result = await query(`
      SELECT
        wi.*,
        COUNT(wr.id) as current_participants
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      WHERE wi.workshop_id = $1
      GROUP BY wi.id
      ORDER BY wi.start_date ASC
    `, [workshopId])

    return (result.rows as WorkshopInstanceRow[]).map((row): WorkshopInstanceWithCount => ({
      id: row.id,
      workshop_id: row.workshop_id,
      start_date: row.start_date,
      end_date: row.end_date,
      location: row.location,
      instructor: row.instructor,
      max_participants: row.max_participants,
      notes: row.notes,
      status: row.status as 'scheduled' | 'cancelled' | 'completed',
      created_at: row.created_at,
      updated_at: row.updated_at,
      current_participants: parseInt(row.current_participants) || 0
    }))
  } catch (error) {
    logger.error('Error fetching workshop instances', { error })
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const workshop = await getWorkshop(params.slug)

  if (!workshop) {
    return {
      title: 'Workshop Not Found | RevampIT'
    }
  }

  return {
    title: `${workshop.title} | RevampIT Workshops`,
    description: workshop.description ?? undefined,
    openGraph: {
      title: `${workshop.title} | RevampIT Workshops`,
      description: workshop.description ?? undefined,
      type: 'website'
    }
  }
}

export default async function WorkshopDetailPage({ params }: { params: { slug: string } }) {
  const workshop = await getWorkshop(params.slug)

  if (!workshop) {
    notFound()
  }

  const instances = await getWorkshopInstances(workshop.id)
  const upcomingInstances = instances.filter(inst => new Date(inst.start_date) > new Date())
  const nextInstance = upcomingInstances[0]

  const getLevelColor = (level: string | null) => {
    if (!level) return 'bg-gray-100 text-gray-800'
    switch (level.toLowerCase()) {
      case 'anfänger': return 'bg-green-100 text-green-800'
      case 'fortgeschrittene': return 'bg-blue-100 text-blue-800'
      case 'alle stufen': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelDescription = (level: string | null) => {
    if (!level) return ''
    switch (level.toLowerCase()) {
      case 'anfänger': return 'Perfekt für Einsteiger ohne Vorkenntnisse'
      case 'fortgeschrittene': return 'Für Teilnehmer mit grundlegenden Kenntnissen'
      case 'alle stufen': return 'Geeignet für alle Erfahrungsstufen'
      default: return level
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/workshops"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Workshops
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{workshop.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(workshop.level)}`}>
                  {workshop.level}
                </span>
              </div>
              <p className="text-xl text-gray-600 mb-4">{workshop.description}</p>
              <p className="text-gray-500">{getLevelDescription(workshop.level)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workshop Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Workshop Details</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Dauer</div>
                  <div className="text-sm text-gray-600">{workshop.duration}</div>
                </div>

                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Max. Teilnehmer</div>
                  <div className="text-sm text-gray-600">{workshop.max_participants}</div>
                </div>

                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Kategorie</div>
                  <div className="text-sm text-gray-600">{workshop.category}</div>
                </div>

                <div className="text-center">
                  <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Preis</div>
                  <div className="text-sm text-gray-600">
                    {workshop.price_cents === 0 ? 'Kostenlos' : `CHF ${(workshop.price_cents / 100).toFixed(0)}`}
                  </div>
                </div>
              </div>

              {workshop.outcomes && workshop.outcomes.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Was du lernst:</h3>
                  <ul className="space-y-2">
                    {workshop.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upcoming Instances */}
            {upcomingInstances.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Kommende Termine</h2>

                <div className="space-y-4">
                  {upcomingInstances.slice(0, 3).map((instance) => (
                    <div key={instance.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {formatDateWithWeekday(instance.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-gray-600">
                              {new Date(instance.start_date).toLocaleTimeString('de-CH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">
                            {instance.current_participants}/{workshop.max_participants} angemeldet
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(instance.current_participants / workshop.max_participants) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{instance.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Form */}
            {nextInstance && (
              <div id="register" className="bg-white rounded-xl shadow-sm p-6">
                <WorkshopRegistrationForm
                  workshop={workshop}
                  instance={nextInstance}
                />
              </div>
            )}

            {/* Workshop Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Statistiken</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategorie</span>
                  <span className="font-medium">{workshop.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className="font-medium">{workshop.level}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Dauer</span>
                  <span className="font-medium">{workshop.duration}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Max. Teilnehmer</span>
                  <span className="font-medium">{workshop.max_participants}</span>
                </div>

                {instances.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Termine</span>
                    <span className="font-medium">{instances.length} verfügbar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Workshop Materials */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Materialien</h3>
              <WorkshopMaterials workshopSlug={workshop.slug} />
            </div>

            {/* Reviews/Feedback */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bewertungen</h3>
              <WorkshopReviews workshopSlug={workshop.slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}