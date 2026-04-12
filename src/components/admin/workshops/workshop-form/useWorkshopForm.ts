'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import type { WorkshopFormData } from './types'
import { INITIAL_WORKSHOP_FORM_DATA } from './types'

export function useWorkshopForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState<WorkshopFormData>(INITIAL_WORKSHOP_FORM_DATA)

  const handleInputChange = (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLearningObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learningObjectives]
    newObjectives[index] = value
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }))
  }

  const addLearningObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, ''],
    }))
  }

  const removeLearningObjective = (index: number) => {
    if (formData.learningObjectives.length > 1) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.title || !formData.description || !formData.date || !formData.instructor) {
        alert('Bitte fülle alle Pflichtfelder aus')
        return
      }

      logger.info('Creating workshop', { title: formData.title })
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/admin/workshops')
    } catch (error) {
      logger.error('Error creating workshop', { error })
    } finally {
      setIsLoading(false)
    }
  }

  return {
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
  }
}
