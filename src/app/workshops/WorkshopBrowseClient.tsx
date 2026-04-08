'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
  Plus,
} from 'lucide-react'
import {
  WORKSHOP_CATEGORIES,
  WORKSHOP_LEVELS,
  getCategoryIcon,
  getLevelBadgeClass,
} from '@/config/workshops'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import type { WorkshopWithInstances } from '@/components/workshops/types'

interface WorkshopBrowseClientProps {
  workshops: WorkshopWithInstances[]
}

export default function WorkshopBrowseClient({ workshops }: WorkshopBrowseClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const filteredWorkshops = workshops.filter(workshop => {
    const matchesCategory =
      categoryFilter === 'all' ||
      (workshop.category || '').toLowerCase() === categoryFilter.toLowerCase()
    const matchesLevel =
      levelFilter === 'all' ||
      (workshop.level || '').toLowerCase() === levelFilter.toLowerCase()
    return matchesCategory && matchesLevel
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact hero — workshops visible without scrolling */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workshops & Kurse</h1>
              <p className="text-sm text-gray-600 mt-1">
                {workshops.length} {workshops.length === 1 ? 'Workshop' : 'Workshops'} · Praxisnah lernen bei RevampIT
              </p>
            </div>
            <Link
              href="/workshops/propose"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-base font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Workshop vorschlagen
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-12 pb-16">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Alle Kategorien</option>
                {WORKSHOP_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Level Dropdown */}
            <div>
              <label htmlFor="filter-level" className="block text-xs font-medium text-gray-700 mb-1">
                Schwierigkeitsgrad
              </label>
              <select
                id="filter-level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Alle Stufen</option>
                {WORKSHOP_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {(categoryFilter !== 'all' || levelFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setLevelFilter('all')
                }}
                className="self-end px-3 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Filter zurücksetzen
              </button>
            )}

            {/* Results count */}
            <div className="ml-auto self-end text-sm text-gray-500">
              {filteredWorkshops.length} {filteredWorkshops.length === 1 ? 'Workshop' : 'Workshops'}
            </div>
          </div>
        </div>

        {/* Workshops Grid */}
        {filteredWorkshops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkshops.map((workshop) => {
              const IconComponent = getCategoryIcon(workshop.category)
              const instances = workshop.instances || []
              const upcomingInstances = instances.filter(
                inst => inst.status === 'scheduled' && new Date(inst.start_date) > new Date()
              )
              const nextInstance = upcomingInstances[0]
              const maxParticipants = nextInstance?.max_participants ?? workshop.max_participants
              const spotsLeft = nextInstance
                ? maxParticipants - nextInstance.current_participants
                : null

              return (
                <div key={workshop.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                  {/* Workshop Header */}
                  <div className="p-6 border-b border-gray-100 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(workshop.level)}`}>
                        {workshop.level || 'Alle Stufen'}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {workshop.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {workshop.description}
                    </p>

                    {/* Category badge */}
                    {workshop.category && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <IconComponent className="w-3 h-3 mr-1" />
                          {WORKSHOP_CATEGORIES.find(c => c.id === workshop.category)?.name || workshop.category}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {workshop.duration && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {workshop.duration}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Max {workshop.max_participants}
                      </div>
                    </div>
                  </div>

                  {/* Workshop Details */}
                  <div className="p-6">
                    {nextInstance ? (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>Nächster Termin: {formatDateShort(nextInstance.start_date)}</span>
                        </div>
                        {nextInstance.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{nextInstance.location}</span>
                          </div>
                        )}
                        {spotsLeft !== null && (
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className={spotsLeft <= 3 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                              {spotsLeft <= 0 ? 'Ausgebucht' : `${spotsLeft} Plätze frei`}
                            </span>
                          </div>
                        )}
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
                        {workshop.price_cents === 0
                          ? 'Kostenlos'
                          : `CHF ${(workshop.price_cents / 100).toFixed(0)}`}
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
                        Details ansehen
                      </Link>

                      {workshop.user_registered ? (
                        <Link
                          href="/dashboard/workshops"
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                        >
                          Verwalten
                        </Link>
                      ) : nextInstance && spotsLeft !== null && spotsLeft > 0 ? (
                        <Link
                          href={`/workshops/${workshop.slug}#register`}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                        >
                          Jetzt anmelden
                        </Link>
                      ) : nextInstance && spotsLeft !== null && spotsLeft <= 0 ? (
                        <span className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-center text-sm font-medium">
                          Ausgebucht
                        </span>
                      ) : (
                        <span className="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-center text-sm font-medium">
                          Kein Termin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {categoryFilter !== 'all' || levelFilter !== 'all'
                ? 'Keine Workshops gefunden'
                : 'Aktuell sind keine Workshops geplant'}
            </h3>
            <p className="text-gray-600 mb-4">
              {categoryFilter !== 'all' || levelFilter !== 'all'
                ? 'Versuche andere Filter oder schau später wieder vorbei.'
                : 'Schau bald wieder vorbei!'}
            </p>
            {(categoryFilter !== 'all' || levelFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setLevelFilter('all')
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <Heading level={2} className="mb-4">
            Workshop vorschlagen?
          </Heading>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Hast du eine Idee für einen Workshop? Wir freuen uns über deine Vorschläge für neue Themen und Inhalte.
          </p>
          <Link
            href="/workshops/propose"
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
