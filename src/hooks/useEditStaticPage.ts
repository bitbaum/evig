'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'

interface PageFormData {
  title: string
  slug: string
  content: string
  is_published: boolean
  seo_title: string
  seo_description: string
}

interface PageData {
  id: string
  slug: string
  title: string
  content: string
  is_published: boolean
  seo_title: string | null
  seo_description: string | null
}

const INITIAL_FORM: PageFormData = {
  title: '',
  slug: '',
  content: '',
  is_published: false,
  seo_title: '',
  seo_description: '',
}

export function useEditStaticPage(pageId: string) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<PageFormData>(INITIAL_FORM)

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !pageId) return
    let cancelled = false
    async function loadPage() {
      setLoading(true)
      const result = await apiFetch<PageData>(`/api/admin/pages/${pageId}`)
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        const page = result.data
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          is_published: page.is_published || false,
          seo_title: page.seo_title || '',
          seo_description: page.seo_description || '',
        })
      } else {
        setError(result.error || 'Seite nicht gefunden')
      }
    }
    loadPage()
    return () => { cancelled = true }
  }, [sessionStatus, pageId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim() || !formData.slug.trim()) {
      setError('Titel und URL-Slug sind erforderlich')
      return
    }

    setSaving(true)
    const result = await apiFetch<void>(`/api/admin/pages/${pageId}`, {
      method: 'PUT',
      body: formData,
    })
    setSaving(false)

    if (result.success) {
      setSuccess('Seite erfolgreich gespeichert')
      setTimeout(() => setSuccess(''), UI_FEEDBACK_MS.SUCCESS)
    } else {
      setError(result.error || 'Fehler beim Speichern')
    }
  }

  return {
    session,
    sessionStatus,
    router,
    loading,
    saving,
    error,
    success,
    formData,
    setFormData,
    handleSubmit,
  }
}
