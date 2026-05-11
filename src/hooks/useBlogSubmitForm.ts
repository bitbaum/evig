'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { BLOG_SUBMISSION_TYPE, type BlogSubmissionType } from '@/config/approval-status'

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  color: string | null
}

export interface BlogBlogFormData {
  name: string
  email: string
  title: string
  category: string
  tags: string
  content: string
}

const EMPTY_FORM: BlogBlogFormData = {
  name: '', email: '', title: '', category: '', tags: '', content: '',
}

export function useBlogSubmitForm() {
  const { data: session } = useSession()
  const [submissionType, setSubmissionType] = useState<BlogSubmissionType>(BLOG_SUBMISSION_TYPE.IDEA)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [formData, setBlogFormData] = useState<BlogFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      setBlogFormData(prev => ({
        ...prev,
        name: session.user.name ?? prev.name,
        email: session.user.email ?? prev.email,
      }))
    }
  }, [session])

  // Fetch categories
  useEffect(() => {
    apiFetch<BlogCategory[]>('/api/blog/categories').then(result => {
      if (result.success && result.data) {
        setCategories(result.data)
      } else if (result.error) {
        logger.warn('Failed to load blog categories', { error: result.error })
      }
    })
  }, [])

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setBlogFormData(prev => {
      const updated = { ...prev }
      if (data.title) updated.title = String(data.title)
      if (data.content) updated.content = String(data.content)
      if (data.category) updated.category = String(data.category)
      if (Array.isArray(data.tags)) updated.tags = data.tags.join(', ')
      else if (data.tags) updated.tags = String(data.tags)
      return updated
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBlogFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    try {
      const result = await apiFetch<unknown>('/api/public/blog/submit', {
        method: 'POST',
        body: {
          ...formData,
          submissionType,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          submittedAt: new Date().toISOString(),
        },
      })
      setSubmitStatus(result.success ? 'success' : 'error')
      if (!result.success) logger.warn('Failed to submit blog post', { error: result.error })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setBlogFormData({
      ...EMPTY_FORM,
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
    })
    setSubmitStatus('idle')
  }

  return {
    submissionType,
    setSubmissionType,
    categories,
    formData,
    isSubmitting,
    submitStatus,
    isLoggedIn: !!session?.user,
    canSubmit: !isSubmitting && formData.title.trim() !== '' && formData.content.trim() !== '',
    handleAIFieldsFilled,
    handleChange,
    handleSubmit,
    handleReset,
  }
}
