'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Page {
  id: string
  slug: string
  title: string
  content: string
  seo_title?: string
  seo_description?: string
  is_published: boolean
}

export default function EditPage() {
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const params = useParams()
  const contentRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    seo_title: '',
    seo_description: '',
  })

  useEffect(() => {
    fetchPage()
  }, [params.id])

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/admin/pages/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPage(data.page)
        setFormData({
          title: data.page.title || '',
          slug: data.page.slug || '',
          content: data.page.content || '',
          seo_title: data.page.seo_title || '',
          seo_description: data.page.seo_description || '',
        })
      } else {
        setError('Page not found')
      }
    } catch (error) {
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (publish = false) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/pages/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_published: publish,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPage(data.page)
        setSuccess(publish ? 'Page published successfully!' : 'Draft saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save page')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const formatText = (command: string) => {
    document.execCommand(command, false)
    if (contentRef.current) {
      setFormData(prev => ({
        ...prev,
        content: contentRef.current!.innerHTML
      }))
    }
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      setFormData(prev => ({
        ...prev,
        content: contentRef.current!.innerHTML
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading page...</span>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
        <Link href="/admin/pages" className="text-green-600 hover:text-green-700">
          ← Back to pages
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Page</h1>
          <p className="text-gray-600 mt-1">Make changes to your page content</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Page Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter page title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="page-url-slug"
              />
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Page Content</h2>

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => formatText('bold')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => formatText('italic')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => formatText('underline')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Underline"
            >
              <u>U</u>
            </button>
            <button
              onClick={() => formatText('insertUnorderedList')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Bullet List"
            >
              • List
            </button>
            <button
              onClick={() => formatText('insertOrderedList')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* Editor */}
          <div
            ref={contentRef}
            contentEditable
            className="min-h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onInput={handleContentChange}
            dangerouslySetInnerHTML={{ __html: formData.content }}
          />
        </div>

        {/* SEO Settings */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">SEO Settings (Optional)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Custom title for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brief description for search engines"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
