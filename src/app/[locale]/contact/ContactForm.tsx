'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, User } from 'lucide-react'
import { ORG } from '@/config/org'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function ContactForm() {
  const t = useTranslations('contact.form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    setError(null)
    try {
      const payload = {
        suggestion: subject.trim() ? `${subject.trim()}\n\n${message.trim()}` : message.trim(),
        contact: [name.trim(), email.trim()].filter(Boolean).join(' | '),
        page: '/contact',
        url: typeof window !== 'undefined' ? window.location.href : `${ORG.website}/contact`,
        pageTitle: 'Contact',
        pageSection: 'Contact',
        feedbackScope: 'page',
        selectedElements: [],
        timestamp: new Date().toISOString()
      }
      const { error: apiError } = await apiFetch('/api/suggestions', {
        method: 'POST',
        body: payload,
      })
      if (apiError) {
        throw new Error(apiError)
      }
      setStatus('success')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t('errorFallback'))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <Heading level={2} className="text-3xl font-bold mb-6 text-center">{t('title')}</Heading>
      {status === 'success' && (
        <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-primary-800 text-sm">
          {t('successMessage')}
        </div>
      )}
      {status === 'error' && (
        <div id="contact-error" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              {t('name')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('namePlaceholder')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
            {t('subject')}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('subjectPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
            {t('message')}
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-neutral-500" />
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              aria-required="true"
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? 'contact-error' : undefined}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('messagePlaceholder')}
            />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-60"
          >
            <Send className="w-5 h-5 mr-2" />
            {status === 'submitting' ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
