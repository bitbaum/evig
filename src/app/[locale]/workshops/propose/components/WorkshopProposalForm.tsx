'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'
import { responsiveButtons } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { BasicInfoSection } from './BasicInfoSection'
import { LearningObjectivesSection } from './LearningObjectivesSection'
import { PracticalDetailsSection } from './PracticalDetailsSection'
import { MaterialsSection } from './MaterialsSection'
import { LocationSection } from './LocationSection'
import { TermsSection } from './TermsSection'
import { AIFormAssist } from '@/components/ai/AIFormAssist'

interface WorkshopLocation {
  id: string
  name: string
  address?: string
  city?: string
  canton?: string
  capacity?: number
  max_capacity?: number
}

interface FormData {
  title: string
  description: string
  shortDescription: string
  category: string
  durationHours: string
  level: 'beginner' | 'intermediate' | 'advanced'
  maxParticipants: string
  minParticipants: string
  pricePerPerson: string
  prerequisites: string
  learningObjectives: string[]
  targetAudience: string
  materialsProvided: string
  materialsRequired: string
  locationType: 'venue' | 'online' | 'home'
  selectedLocationId: string
  proposedLocation: string
  proposedDate: string
  proposedTime: string
  specialRequirements: string
  termsAccepted: boolean
}

interface SubmitResult {
  success: boolean
  message: string
}

export function WorkshopProposalForm() {
  const router = useRouter()
  const t = useTranslations('workshops.propose')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    durationHours: '',
    level: 'beginner',
    maxParticipants: '10',
    minParticipants: '3',
    pricePerPerson: '',
    prerequisites: '',
    learningObjectives: [],
    targetAudience: '',
    materialsProvided: '',
    materialsRequired: '',
    locationType: 'venue',
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
    const result = await apiFetch<{ locations: WorkshopLocation[] }>(
      '/api/locations?status=approved&type=venue&limit=50',
    )
    if (result.success && result.data) {
      setAvailableLocations(result.data.locations || [])
    } else {
      logger.warn('Failed to load locations', { error: result.error })
    }
    setLoadingLocations(false)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationSelect = (locationId: string, locationName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLocationId: locationId,
      proposedLocation: locationName
    }))
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

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setFormData(prev => {
      const updated = { ...prev }
      if (data.title) updated.title = String(data.title)
      if (data.description) updated.description = String(data.description)
      if (data.shortDescription) updated.shortDescription = String(data.shortDescription)
      if (data.category) updated.category = String(data.category)
      if (data.level) updated.level = String(data.level) as FormData['level']
      if (data.targetAudience) updated.targetAudience = String(data.targetAudience)
      if (data.prerequisites) updated.prerequisites = String(data.prerequisites)
      if (Array.isArray(data.learningObjectives)) updated.learningObjectives = data.learningObjectives.map(String)
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      setSubmitResult({
        success: false,
        message: t('form.termsError')
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const result = await apiFetch<unknown>('/api/workshops/propose', {
        method: 'POST',
        body: formData,
      })

      if (result.success) {
        setSubmitResult({
          success: true,
          message: formData.title,
        })
      } else {
        setSubmitResult({
          success: false,
          message: result.error || t('form.genericError'),
        })
      }
    } catch (error) {
      logger.error('Workshop proposal submission failed', { error })
      setSubmitResult({
        success: false,
        message: t('form.networkError'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-shell p-8">
      <AIFormAssist
        formType="workshop"
        variant="section"
        defaultExpanded={true}
        placeholder={t('form.aiPlaceholder')}
        onFieldsFilled={handleAIFieldsFilled}
        currentData={formData as unknown as Record<string, unknown>}
        className="mb-8"
      />

      <BasicInfoSection
        title={formData.title}
        category={formData.category}
        level={formData.level}
        shortDescription={formData.shortDescription}
        description={formData.description}
        onChange={handleFieldChange}
      />

      <LearningObjectivesSection
        objectives={formData.learningObjectives}
        onAdd={addLearningObjective}
        onUpdate={updateLearningObjective}
        onRemove={removeLearningObjective}
      />

      <PracticalDetailsSection
        durationHours={formData.durationHours}
        pricePerPerson={formData.pricePerPerson}
        maxParticipants={formData.maxParticipants}
        minParticipants={formData.minParticipants}
        targetAudience={formData.targetAudience}
        prerequisites={formData.prerequisites}
        onChange={handleFieldChange}
      />

      <MaterialsSection
        materialsProvided={formData.materialsProvided}
        materialsRequired={formData.materialsRequired}
        onChange={handleFieldChange}
      />

      <LocationSection
        locationType={formData.locationType}
        selectedLocationId={formData.selectedLocationId}
        proposedLocation={formData.proposedLocation}
        proposedDate={formData.proposedDate}
        proposedTime={formData.proposedTime}
        specialRequirements={formData.specialRequirements}
        availableLocations={availableLocations}
        loadingLocations={loadingLocations}
        onChange={handleFieldChange}
        onLocationSelect={handleLocationSelect}
      />

      <TermsSection
        termsAccepted={formData.termsAccepted}
        onChange={(accepted) => setFormData(prev => ({ ...prev, termsAccepted: accepted }))}
      />

      {submitResult && (
        <div
          id={submitResult.success ? undefined : 'workshop-propose-error'}
          className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/30 text-primary-800 dark:text-primary-300'
              : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800/30 text-error-800 dark:text-error-400'
          }`}
        >
          {submitResult.success ? (
            <div>
              <Heading level={3} className="font-semibold mb-2">
                {t('form.successTitle')}
              </Heading>
              <p className="mb-1">
                <span className="font-medium">&laquo;{submitResult.message}&raquo;</span> {t('form.successSubmitted')}
              </p>
              <p className="mb-4">{t('form.successMessage')}</p>
              <Link
                href="/workshops"
                className="inline-flex items-center text-primary-700 underline hover:text-primary-900 font-medium"
              >
                {t('form.backToWorkshops')}
              </Link>
            </div>
          ) : (
            <div>
              <Heading level={3} className="font-semibold mb-1">{t('form.errorTitle')}</Heading>
              <p>{submitResult.message}</p>
            </div>
          )}
        </div>
      )}

      {!submitResult?.success && (
      <div className="text-center">
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || !formData.category || !formData.termsAccepted}
          className={`${responsiveButtons.primary} inline-flex items-center bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('form.submitting')}
            </>
          ) : (
            t('form.submit')
          )}
        </button>

        <p className="text-sm text-neutral-600 mt-4">
          {t('form.reviewNote')}
        </p>
      </div>
      )}
    </form>
  )
}
