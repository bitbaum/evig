'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  MapPin,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  BookOpen,
  Target
} from 'lucide-react'
import { WORKSHOP_CATEGORIES, WORKSHOP_LEVELS } from '@/config/workshops'

interface WorkshopLocation {
  id: string
  name: string
  address?: string
  city?: string
  canton?: string
  capacity?: number
  max_capacity?: number
}

export default function WorkshopProposalPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    durationHours: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    maxParticipants: '10',
    minParticipants: '3',
    pricePerPerson: '',
    prerequisites: '',
    learningObjectives: [] as string[],
    targetAudience: '',
    materialsProvided: '',
    materialsRequired: '',
    locationType: 'venue' as 'venue' | 'online' | 'home',
    selectedLocationId: '',
    proposedLocation: '',
    proposedDate: '',
    proposedTime: '',
    specialRequirements: '',
    termsAccepted: false
  })

  const [availableLocations, setAvailableLocations] = useState<WorkshopLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Load available locations when location type is venue
  useEffect(() => {
    if (formData.locationType === 'venue') {
      loadAvailableLocations()
    }
  }, [formData.locationType])

  const loadAvailableLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch('/api/locations?status=approved&type=venue&limit=50')
      if (response.ok) {
        const data = await response.json()
        setAvailableLocations(data.locations || [])
      }
    } catch (error) {
      logger.error('Failed to load locations', { error })
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      setSubmitResult({
        success: false,
        message: 'Bitte akzeptieren Sie die Nutzungsbedingungen'
      })
      return
    }

    if (formData.learningObjectives.length === 0) {
      setSubmitResult({
        success: false,
        message: 'Bitte geben Sie mindestens ein Lernziel an'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/workshops/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Ihr Workshop-Vorschlag wurde erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit weiteren Informationen.'
        })

        // Redirect after success
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLearningObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }))
  }

  const updateLearningObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.map((obj, i) => i === index ? value : obj)
    }))
  }

  const removeLearningObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }))
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anmeldung erforderlich</h1>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an, um einen Workshop vorzuschlagen.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Workshop vorschlagen
            </h1>
            <p className="text-gray-600">
              Schlagen Sie einen neuen Workshop vor und teilen Sie Ihr Wissen mit der Community
            </p>
          </div>
        </div>

        {submitResult && (
          <div
            id={submitResult.success ? undefined : 'workshop-propose-error'}
            className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {submitResult.success ? (
                <CheckCircle className="w-6 h-6 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 mr-3" />
              )}
              <div>
                <h3 className="font-semibold mb-1">
                  {submitResult.success ? 'Vorschlag erfolgreich!' : 'Fehler'}
                </h3>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Grundinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workshop-Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Linux für Anfänger"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="">Kategorie wählen</option>
                  {WORKSHOP_CATEGORIES.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schwierigkeitsgrad *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  {WORKSHOP_LEVELS.filter(l => l.id !== 'all').map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kurze Beschreibung *
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Eine kurze, einprägsame Beschreibung (erscheint in der Übersicht)"
                  required
                  aria-required="true"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detaillierte Beschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Beschreiben Sie den Workshop detailliert..."
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Lernziele
            </h2>

            <div className="space-y-3">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateLearningObjective(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="z.B. Grundlagen der Linux-Befehlszeile beherrschen"
                  />
                  <button
                    type="button"
                    onClick={() => removeLearningObjective(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    Entfernen
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addLearningObjective}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                + Lernziel hinzufügen
              </button>
            </div>
          </div>

          {/* Practical Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Praktische Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dauer (Stunden) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.durationHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preis pro Person (CHF) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerPerson: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00 (kostenlos)"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale Teilnehmerzahl *
                </label>
                <select
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  {[5, 8, 10, 12, 15, 20, 25, 30].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindestteilnehmerzahl *
                </label>
                <select
                  value={formData.minParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, minParticipants: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  {[2, 3, 4, 5, 6, 8, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zielgruppe
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Anfänger ohne Vorkenntnisse, Jugendliche 14-18 Jahre"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voraussetzungen
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Eigener Laptop mit Linux installiert"
                />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Materialien & Vorbereitung
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vom Veranstalter bereitgestellte Materialien
                </label>
                <textarea
                  value={formData.materialsProvided}
                  onChange={(e) => setFormData(prev => ({ ...prev, materialsProvided: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Arbeitsblätter, Beispiel-Code, Getränke"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Von Teilnehmern mitzubringen
                </label>
                <textarea
                  value={formData.materialsRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, materialsRequired: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Eigener Laptop, Schreibzeug"
                />
              </div>
            </div>
          </div>

          {/* Location & Scheduling */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Ort & Zeitplan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Art des Workshops *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="venue"
                      checked={formData.locationType === 'venue'}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value as 'venue' | 'online' | 'home' }))}
                      className="mr-3 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">In einem Veranstaltungsort (z.B. Gemeinschaftszentrum)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="online"
                      checked={formData.locationType === 'online'}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value as 'venue' | 'online' | 'home' }))}
                      className="mr-3 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Online über Video-Konferenz</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="home"
                      checked={formData.locationType === 'home'}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value as 'venue' | 'online' | 'home' }))}
                      className="mr-3 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Bei Ihnen zu Hause oder in Ihren Räumlichkeiten</span>
                  </label>
                </div>
              </div>

              {formData.locationType === 'venue' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verfügbare Orte
                    </label>
                    {loadingLocations ? (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span>Lade verfügbare Orte...</span>
                      </div>
                    ) : availableLocations.length > 0 ? (
                      <select
                        value={formData.selectedLocationId}
                        onChange={(e) => {
                          const selectedLocation = availableLocations.find(loc => loc.id === e.target.value)
                          setFormData(prev => ({
                            ...prev,
                            selectedLocationId: e.target.value,
                            proposedLocation: selectedLocation ? `${selectedLocation.name}, ${selectedLocation.city}` : ''
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Ort auswählen...</option>
                        {availableLocations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} - {location.city}, {location.canton}
                            {location.max_capacity && ` (max. ${location.max_capacity} Personen)`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p>Keine genehmigten Veranstaltungsorte verfügbar.</p>
                        <p className="mt-1">Sie können einen neuen Ort vorschlagen oder einen bestehenden Ort zur Genehmigung einreichen.</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternativer Ort (falls kein passender verfügbar)
                    </label>
                    <input
                      type="text"
                      value={formData.proposedLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="z.B. Mein Zuhause, oder neuer Veranstaltungsort"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Verwenden Sie dieses Feld, wenn Sie einen neuen Ort vorschlagen möchten
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorgeschlagenes Datum
                    </label>
                    <input
                      type="date"
                      value={formData.proposedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorgeschlagene Uhrzeit
                    </label>
                    <input
                      type="time"
                      value={formData.proposedTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {formData.locationType === 'home' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.proposedLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ihre vollständige Adresse"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorgeschlagenes Datum
                    </label>
                    <input
                      type="date"
                      value={formData.proposedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorgeschlagene Uhrzeit
                    </label>
                    <input
                      type="time"
                      value={formData.proposedTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Besondere Anforderungen
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Beamer, Whiteboard, Internetzugang, spezielle Software"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutzungsbedingungen für Workshop-Veranstalter</h3>

              <div className="space-y-3 text-sm text-gray-700 mb-4">
                <p>• Ich verpflichte mich, Workshops mit hoher Qualität und Engagement durchzuführen</p>
                <p>• Ich werde alle Teilnehmer respektvoll und professionell behandeln</p>
                <p>• Ich bin für die Sicherheit und den reibungslosen Ablauf des Workshops verantwortlich</p>
                <p>• Ich werde angemessene Vorkenntnisse und klare Lernziele kommunizieren</p>
                <p>• Ich akzeptiere das Bewertungssystem und die Plattformgebühren</p>
                <p>• Meine Angaben sind wahrheitsgemäss und ich werde sie aktuell halten</p>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mr-3 text-green-600 focus:ring-green-500"
                    required
                    aria-required="true"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Ich akzeptiere die <Link href="/terms" className="text-green-600 hover:text-green-700 underline">Nutzungsbedingungen</Link> und die <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">Datenschutzerklärung</Link>
                  </label>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting || !formData.termsAccepted}
              className="inline-flex items-center px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vorschlag wird eingereicht...
                </>
              ) : (
                'Workshop-Vorschlag einreichen'
              )}
            </button>

            <p className="text-sm text-gray-600 mt-4">
              Nach Einreichung wird Ihr Vorschlag geprüft. Dies kann 1-2 Werktage dauern.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}