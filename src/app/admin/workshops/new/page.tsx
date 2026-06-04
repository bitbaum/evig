'use client'

import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useWorkshopForm,
  WorkshopBasicInfoSection,
  WorkshopInstructorSection,
  WorkshopScheduleSection,
  WorkshopParticipantsSection,
  WorkshopLearningObjectives,
  WorkshopPrerequisitesSection,
  WorkshopImageUpload,
  WorkshopTagsSection,
} from '@/components/admin/workshops/workshop-form'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import type { WorkshopFormData } from '@/components/admin/workshops/workshop-form/types'

export default function NewWorkshopPage() {
  const {
    formData,
    isLoading,
    imagePreviews,
    handleInputChange,
    handleLearningObjectiveChange,
    addLearningObjective,
    removeLearningObjective,
    handleImageUpload,
    removeImage,
    addTag,
    removeTag,
    handleSubmit,
  } = useWorkshopForm()

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>, _metadata: Record<string, AIFieldMetadataEntry>) => {
    const textFields: Array<keyof WorkshopFormData> = ['title', 'description', 'shortDescription', 'category', 'level', 'instructor', 'instructorBio', 'location', 'locationDetails', 'maxParticipants', 'price', 'prerequisites', 'materials']
    textFields.forEach(field => {
      if (data[field] !== undefined) {
        handleInputChange(field, String(data[field]))
      }
    })
    if (Array.isArray(data.tags)) {
      handleInputChange('tags', data.tags.map(String))
    }
    if (Array.isArray(data.learningObjectives)) {
      handleInputChange('learningObjectives', data.learningObjectives.map(String))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={ROUTES.admin.workshops} className="p-2 rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/6">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <Heading level={1} className="text-2xl font-bold text-text-primary">Workshop erstellen</Heading>
          <p className="text-text-secondary mt-1">Plane und veröffentliche einen neuen Workshop</p>
        </div>
      </div>

      <AIFormAssist
        formType="workshop"
        variant="section"
        defaultExpanded={true}
        placeholder='z.B. "Linux-Workshop für Anfänger, 3 Stunden, max. 12 Personen, kostenlos"'
        currentData={{ title: formData.title, description: formData.description, shortDescription: formData.shortDescription, category: formData.category, level: formData.level, instructor: formData.instructor, location: formData.location, price: formData.price, prerequisites: formData.prerequisites }}
        onFieldsFilled={handleAIFieldsFilled}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <WorkshopBasicInfoSection formData={formData} onInputChange={handleInputChange} />
        <WorkshopInstructorSection formData={formData} onInputChange={handleInputChange} />
        <WorkshopScheduleSection formData={formData} onInputChange={handleInputChange} />
        <WorkshopParticipantsSection formData={formData} onInputChange={handleInputChange} />
        <WorkshopLearningObjectives
          objectives={formData.learningObjectives}
          onObjectiveChange={handleLearningObjectiveChange}
          onAdd={addLearningObjective}
          onRemove={removeLearningObjective}
        />
        <WorkshopPrerequisitesSection formData={formData} onInputChange={handleInputChange} />
        <WorkshopImageUpload imagePreviews={imagePreviews} onImageUpload={handleImageUpload} onRemoveImage={removeImage} />
        <WorkshopTagsSection tags={formData.tags} onAddTag={addTag} onRemoveTag={removeTag} />

        <div className="flex justify-end gap-4">
          <Link
            href={ROUTES.admin.workshops}
            className="px-6 py-3 border border-default text-text-secondary rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/6 font-medium"
          >
            Abbrechen
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2 px-6 py-3">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Workshop wird erstellt...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Workshop erstellen
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
