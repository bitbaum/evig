'use client'

import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/workshops" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workshop erstellen</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Planen und veröffentlichen Sie einen neuen Workshop</p>
        </div>
      </div>

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
            href="/admin/workshops"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
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
          </button>
        </div>
      </form>
    </div>
  )
}
