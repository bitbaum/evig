'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Lightbulb, FileText } from 'lucide-react'

type SubmissionType = 'idea' | 'draft'

interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  color: string | null
}

export default function SubmitPostPage() {
  const [submissionType, setSubmissionType] = useState<SubmissionType>('idea')
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    category: '',
    tags: '',
    content: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Fetch categories from database
  useEffect(() => {
    fetch('/api/blog/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategories(data.data)
        }
      })
      .catch(() => {
        // Silently fail - categories are optional
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/public/blog/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submissionType,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Submission failed')

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        title: '',
        category: '',
        tags: '',
        content: '',
      })
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center text-green-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Beitrag einreichen
          </h1>
          <p className="text-xl text-green-100">
            Teilen Sie Ihre Ideen und Erfahrungen mit unserer Community!
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Submission Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Was möchten Sie einreichen?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSubmissionType('idea')}
              className={`p-6 rounded-lg border-2 transition-all ${
                submissionType === 'idea'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <Lightbulb className={`w-8 h-8 mb-3 ${submissionType === 'idea' ? 'text-green-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Post-Idee</h3>
              <p className="text-sm text-gray-600">
                Schlagen Sie ein Thema vor, über das wir schreiben sollten
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSubmissionType('draft')}
              className={`p-6 rounded-lg border-2 transition-all ${
                submissionType === 'draft'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <FileText className={`w-8 h-8 mb-3 ${submissionType === 'draft' ? 'text-green-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vollständiger Entwurf</h3>
              <p className="text-sm text-gray-600">
                Reichen Sie einen vollständigen Artikel zur Überprüfung ein
              </p>
            </button>
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {submissionType === 'idea' ? 'Ihre Idee' : 'Ihr Entwurf'}
          </h2>

          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Ihr Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre E-Mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="max@beispiel.de"
              />
            </div>
          </div>

          {/* Post Info */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {submissionType === 'idea' ? 'Titel der Idee *' : 'Artikel-Titel *'}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={submissionType === 'idea' ? 'Wie man alte Laptops wiederverwendet' : 'Linux auf alten ThinkPads: Ein vollständiger Leitfaden'}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Kategorie wählen</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (kommagetrennt)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Linux, ThinkPad, Tutorial"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {submissionType === 'idea' ? 'Beschreibung der Idee *' : 'Artikel-Inhalt * (Markdown unterstützt)'}
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={submissionType === 'idea' ? 6 : 16}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
              placeholder={
                submissionType === 'idea'
                  ? 'Beschreiben Sie Ihre Idee für einen Blogbeitrag...'
                  : '## Einleitung\n\nIhr Artikel in Markdown...\n\n### Abschnitt 1\n\nInhalt hier...'
              }
            />
            {submissionType === 'draft' && (
              <p className="mt-2 text-sm text-gray-500">
                Sie können Markdown-Formatierung verwenden: **fett**, *kursiv*, [Links](url), usw.
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Richtlinien für Einreichungen</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stellen Sie sicher, dass Ihr Inhalt original ist</li>
              <li>• Verwenden Sie eine klare, respektvolle Sprache</li>
              <li>• Fügen Sie praktische Beispiele und Tipps hinzu</li>
              <li>• Wir überprüfen alle Einreichungen vor der Veröffentlichung</li>
              <li>• Sie erhalten eine E-Mail über den Status Ihrer Einreichung</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              * Pflichtfelder
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Einreichen
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Vielen Dank für Ihre Einreichung!</p>
              <p className="text-green-700 text-sm mt-1">
                Wir werden Ihre Einreichung überprüfen und uns per E-Mail bei Ihnen melden.
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Fehler beim Senden</p>
              <p className="text-red-700 text-sm mt-1">
                Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
