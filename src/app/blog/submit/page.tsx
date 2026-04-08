'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Lightbulb, FileText, Edit } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { logger } from '@/lib/logger'

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
      .catch((error) => {
        logger.warn('Failed to load blog categories', { error })
      })
  }, [])

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setFormData(prev => {
      const updated = { ...prev }
      if (data.title) updated.title = String(data.title)
      if (data.content) updated.content = String(data.content)
      if (data.category) updated.category = String(data.category)
      if (Array.isArray(data.tags)) updated.tags = data.tags.join(', ')
      else if (data.tags) updated.tags = String(data.tags)
      return updated
    })
  }

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
      <div className="relative">
        <PageHero
          theme="about"
          icon={Edit}
          title="Beitrag einreichen"
          subtitle="Teile deine Ideen und Erfahrungen mit unserer Community!"
        />
        <div className="absolute top-4 left-4 sm:left-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Blog
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Submission Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Was möchtest du einreichen?</h2>
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
                Schlage ein Thema vor, über das wir schreiben sollten
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
                Reiche einen vollständigen Artikel zur Überprüfung ein
              </p>
            </button>
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {submissionType === 'idea' ? 'deine Idee' : 'dein Entwurf'}
          </h2>

          {/* AI Assistant */}
          <AIFormAssist
            formType="blog-submit"
            placeholder={submissionType === 'idea' ? 'Beschreibe deine Artikelidee...' : 'Beschreibe worum es in deinem Artikel geht...'}
            onFieldsFilled={handleAIFieldsFilled}
            currentData={formData}
            className="mb-6"
          />

          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                dein Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                aria-required="true"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                deine E-Mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-required="true"
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
              aria-required="true"
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
              aria-required="true"
              rows={submissionType === 'idea' ? 6 : 16}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
              placeholder={
                submissionType === 'idea'
                  ? 'Beschreibe deine Idee für einen Blogbeitrag...'
                  : '## Einleitung\n\nIhr Artikel in Markdown...\n\n### Abschnitt 1\n\nInhalt hier...'
              }
            />
            {submissionType === 'draft' && (
              <p className="mt-2 text-sm text-gray-500">
                du kannst Markdown-Formatierung verwenden: **fett**, *kursiv*, [Links](url), usw.
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Richtlinien für Einreichungen</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stell direr, dass dein Inhalt original ist</li>
              <li>• Verwende eine klare, respektvolle Sprache</li>
              <li>• Füge praktische Beispiele und Tipps hinzu</li>
              <li>• Wir überprüfen alle Einreichungen vor der Veröffentlichung</li>
              <li>• du erhältst eine E-Mail über den Status deiner Einreichung</li>
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
              <p className="text-green-800 font-medium">✅ Vielen Dank für deine Einreichung!</p>
              <p className="text-green-700 text-sm mt-1">
                Wir werden deine Einreichung überprüfen und uns per E-Mail bei dir melden.
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Fehler beim Senden</p>
              <p className="text-red-700 text-sm mt-1">
                Bitte versuche es später erneut oder kontaktiere uns direkt.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
