'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, User } from 'lucide-react'
import { ORG } from '@/config/org'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
    <div className="card-shell p-8">
      <Heading level={2} className="text-3xl font-bold mb-6 text-center">{t('title')}</Heading>
      {status === 'success' && (
        <div className="mb-6 rounded-lg border border-primary-200 dark:border-primary-700/50 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-primary-800 dark:text-primary-200 text-sm">
          {t('successMessage')}
        </div>
      )}
      {status === 'error' && (
        <div id="contact-error" className="mb-6 rounded-lg border border-error-200 dark:border-error-700/50 bg-error-50 dark:bg-error-900/20 px-4 py-3 text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
              {t('name')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-tertiary" />
              </div>
              <Input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                placeholder={t('namePlaceholder')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-tertiary" />
              </div>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">
            {t('subject')}
          </label>
          <Input
            type="text"
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('subjectPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
            {t('message')}
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-text-tertiary" />
            </div>
            <Textarea
              id="message"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              aria-required="true"
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? 'contact-error' : undefined}
              className="pl-10"
              placeholder={t('messagePlaceholder')}
            />
          </div>
        </div>
        <div className="flex justify-center">
          <Button type="submit" variant="primary" disabled={status === 'submitting'}>
            <Send className="w-5 h-5 mr-2" />
            {status === 'submitting' ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
