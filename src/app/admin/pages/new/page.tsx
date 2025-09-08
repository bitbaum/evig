'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    seo_title: '',
    seo_description: '',
  })

  const handleSave = async (publish = false) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
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
        setSuccess(publish ? 'Page created and published!' : 'Page created as draft!')

        // Redirect to edit page after successful creation
        setTimeout(() => {
          router.push(`/admin/pages/${data.page.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create page')
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Page</h1>
          <p className="text-gray-600 mt-1">Add a new static page to your website</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create & Publish'}
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
                required
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
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your page URL: /your-slug
              </p>
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
          <p className="text-sm text-gray-500 mt-2">
            Start typing your page content here. Use the toolbar above to format your text.
          </p>
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
