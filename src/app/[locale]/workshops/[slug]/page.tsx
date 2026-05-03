import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { query } from '@/lib/auth/db'
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger'
import { formatDateWithWeekday, formatTime } from '@/lib/date-formats'
import { TABLE_NAMES } from '@/config/database'
import { getLevelBadgeClass, WORKSHOP_CATEGORIES, WORKSHOP_INSTANCE_STATUS, type WorkshopInstanceStatus } from '@/config/workshops'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Award,
  Target,
  Package,
  ClipboardList,
} from 'lucide-react'
import WorkshopRegistrationForm from '@/components/workshops/WorkshopRegistrationForm'
import WorkshopReviews from '@/components/workshops/WorkshopReviews'
import WorkshopMaterials from '@/components/workshops/WorkshopMaterials'
import type { WorkshopInstanceWithCount } from '@/components/workshops/types'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

// Extended Workshop type to include fields from migration 038
interface WorkshopDetail {
  id: string
  slug: string
  title: string
  description: string | null
  short_description: string | null
  category: string | null
  duration: string | null
  level: string | null
  max_participants: number
  price_cents: number
  is_active: boolean
  prerequisites: string | null
  learning_objectives: string[] | null
  target_audience: string | null
  materials_provided: string | null
  materials_required: string | null
  created_at: string
  updated_at: string
}

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

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

async function getWorkshop(slug: string): Promise<WorkshopDetail | null> {
  try {
    const result = await query(
      `SELECT id, slug, title, description, short_description, category, duration, level,
              max_participants, price_cents, is_active, prerequisites, learning_objectives,
              target_audience, materials_provided, materials_required, created_at, updated_at
       FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    return (result.rows[0] as WorkshopDetail) || null
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
      status: row.status as WorkshopInstanceStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      current_participants: parseInt(row.current_participants) || 0
    }))
  } catch (error) {
    logger.error('Error fetching workshop instances', { error })
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshops' })
  const workshop = await getWorkshop(slug)

  if (!workshop) {
    return {
      title: `${t('detail.notFound')} | ${ORG.name}`
    }
  }

  const description = workshop.short_description || workshop.description || undefined

  return {
    title: `${workshop.title} | ${ORG.name} ${t('meta.title')}`,
    description,
    openGraph: {
      title: `${workshop.title} | ${ORG.name} ${t('meta.title')}`,
      description,
      type: 'website'
    }
  }
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshops' })
  const workshop = await getWorkshop(slug)

  if (!workshop) {
    notFound()
  }

  const instances = await getWorkshopInstances(workshop.id)
  const upcomingInstances = instances.filter(
    inst => inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED && new Date(inst.start_date) > new Date()
  )
  const nextInstance = upcomingInstances[0]
  const categoryName = WORKSHOP_CATEGORIES.find(c => c.id === workshop.category)?.name || workshop.category

  // Build a Workshop-compatible object for the registration form
  const workshopForForm = {
    id: workshop.id,
    slug: workshop.slug,
    title: workshop.title,
    description: workshop.description,
    category: workshop.category,
    duration: workshop.duration,
    level: workshop.level,
    max_participants: workshop.max_participants,
    price_cents: workshop.price_cents,
    is_active: workshop.is_active,
    created_at: workshop.created_at,
    updated_at: workshop.updated_at,
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/workshops"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('detail.backToWorkshops')}
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Heading level={1} className="text-3xl text-neutral-900">{workshop.title}</Heading>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeClass(workshop.level)}`}>
                  {workshop.level || t('detail.allLevels')}
                </span>
              </div>
              {workshop.short_description && (
                <p className="text-xl text-neutral-600 mb-2">{workshop.short_description}</p>
              )}
              <p className="text-neutral-600 mb-4">
                {workshop.description}
              </p>
              {categoryName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {categoryName}
                </span>
              )}
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
              <Heading level={2} className="text-xl text-neutral-900 mb-4">{t('detail.details')}</Heading>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-neutral-900">{t('detail.duration')}</div>
                  <div className="text-sm text-neutral-600">{workshop.duration || t('detail.variableDuration')}</div>
                </div>

                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-neutral-900">{t('detail.maxParticipants')}</div>
                  <div className="text-sm text-neutral-600">{workshop.max_participants}</div>
                </div>

                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-neutral-900">{t('detail.category')}</div>
                  <div className="text-sm text-neutral-600">{categoryName || t('detail.generalCategory')}</div>
                </div>

                <div className="text-center">
                  <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-neutral-900">{t('detail.price')}</div>
                  <div className="text-sm text-neutral-600">
                    {workshop.price_cents === 0 ? t('detail.free') : t('detail.priceChf', { amount: (workshop.price_cents / 100).toFixed(0) })}
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              {workshop.target_audience && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-neutral-500" />
                    <Heading level={3} className="text-lg text-neutral-900">{t('detail.targetAudience')}</Heading>
                  </div>
                  <p className="text-neutral-700">{workshop.target_audience}</p>
                </div>
              )}

              {/* Prerequisites */}
              {workshop.prerequisites && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-neutral-500" />
                    <Heading level={3} className="text-lg text-neutral-900">{t('detail.prerequisites')}</Heading>
                  </div>
                  <p className="text-neutral-700">{workshop.prerequisites}</p>
                </div>
              )}

              {/* Learning Objectives */}
              {workshop.learning_objectives && workshop.learning_objectives.length > 0 && (
                <div className="mb-6">
                  <Heading level={3} className="text-lg text-neutral-900 mb-3">{t('detail.learningObjectives')}</Heading>
                  <ul className="space-y-2">
                    {workshop.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-neutral-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {(workshop.materials_provided || workshop.materials_required) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-neutral-500" />
                    <Heading level={3} className="text-lg text-neutral-900">{t('detail.materials')}</Heading>
                  </div>
                  {workshop.materials_provided && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-neutral-700 mb-1">{t('detail.materialsProvided')}</p>
                      <p className="text-neutral-600">{workshop.materials_provided}</p>
                    </div>
                  )}
                  {workshop.materials_required && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1">{t('detail.materialsRequired')}</p>
                      <p className="text-neutral-600">{workshop.materials_required}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming Instances */}
            {upcomingInstances.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <Heading level={2} className="text-xl text-neutral-900 mb-4">{t('detail.upcomingDates')}</Heading>

                <div className="space-y-4">
                  {upcomingInstances.map((instance) => {
                    const maxParts = instance.max_participants ?? workshop.max_participants
                    const spotsLeft = maxParts - instance.current_participants
                    const isFull = spotsLeft <= 0

                    return (
                      <div key={instance.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center">
                              <Calendar className="w-5 h-5 text-neutral-400 mr-2" />
                              <span className="font-medium text-neutral-900">
                                {formatDateWithWeekday(instance.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-5 h-5 text-neutral-400 mr-2" />
                              <span className="text-neutral-600">
                                {formatTime(instance.start_date)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {isFull ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
                                {t('detail.soldOut')}
                              </span>
                            ) : (
                              <>
                                <div className="text-sm text-neutral-600 mb-1">
                                  {t('detail.registrationCount', { current: instance.current_participants, max: maxParts })}
                                </div>
                                <div className="w-24 bg-neutral-200 rounded-full h-2">
                                  <div
                                    className="bg-primary-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, (instance.current_participants / maxParts) * 100)}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-neutral-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{instance.location || t('detail.locationTba')}</span>
                          </div>
                          {instance.instructor && (
                            <span className="text-sm text-neutral-500">
                              {t('detail.instructor', { name: instance.instructor })}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Form */}
            {nextInstance ? (
              <div id="register" className="bg-white rounded-xl shadow-sm p-6">
                <WorkshopRegistrationForm
                  workshop={workshopForForm}
                  instance={nextInstance}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <Heading level={3} className="text-lg text-neutral-900 mb-4">{t('detail.registration')}</Heading>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    {t('detail.noDates')}
                  </p>
                </div>
              </div>
            )}

            {/* Workshop Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Heading level={3} className="text-lg text-neutral-900 mb-4">{t('detail.stats')}</Heading>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">{t('detail.category')}</span>
                  <span className="font-medium">{categoryName || t('detail.generalCategory')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">{t('detail.level')}</span>
                  <span className="font-medium">{workshop.level || t('detail.allLevels')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">{t('detail.duration')}</span>
                  <span className="font-medium">{workshop.duration || t('detail.variableDuration')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">{t('detail.maxParticipants')}</span>
                  <span className="font-medium">{workshop.max_participants}</span>
                </div>

                {instances.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('detail.dates')}</span>
                    <span className="font-medium">{t('detail.datesAvailable', { count: upcomingInstances.length })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Workshop Materials */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Heading level={3} className="text-lg text-neutral-900 mb-4">{t('detail.materials')}</Heading>
              <WorkshopMaterials workshopSlug={workshop.slug} />
            </div>

            {/* Reviews/Feedback */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Heading level={3} className="text-lg text-neutral-900 mb-4">{t('detail.reviews')}</Heading>
              <WorkshopReviews workshopSlug={workshop.slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
