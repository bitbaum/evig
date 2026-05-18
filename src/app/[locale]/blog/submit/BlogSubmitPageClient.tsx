'use client'

import { Link } from '@/i18n/navigation'
import { ArrowLeft, Send, Lightbulb, FileText, Edit, CheckCircle } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { BLOG_SUBMISSION_TYPE } from '@/config/approval-status'
import { useBlogSubmitForm } from '@/hooks/useBlogSubmitForm'

export default function SubmitPostPage() {
  const t = useTranslations('blog.submit')
  const {
    submissionType,
    setSubmissionType,
    categories,
    formData,
    isSubmitting,
    submitStatus,
    isLoggedIn,
    canSubmit,
    handleAIFieldsFilled,
    handleChange,
    handleSubmit,
    handleReset,
  } = useBlogSubmitForm()

  const hero = (
    <div className="relative">
      <PageHero
        theme="about"
        icon={Edit}
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
      />
      <div className="absolute top-4 left-4 sm:left-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToBlog')}
        </Link>
      </div>
    </div>
  )

  if (submitStatus === 'success') {
    return (
      <main className="min-h-screen bg-neutral-50">
        {hero}
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-6" />
            <Heading level={2} className="text-2xl text-neutral-900 mb-3">{t('successTitle')}</Heading>
            <p className="text-neutral-700 text-lg mb-2">{t('successMessage')}</p>
            <p className="text-neutral-500 text-sm mb-8">{t('successEmailNote')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
              >
                {t('submitAnotherButton')}
              </button>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t('toBlogButton')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {hero}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Submission Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <Heading level={2} className="text-2xl text-neutral-900 mb-6">{t('whatToSubmit')}</Heading>
          <div className="grid md:grid-cols-2 gap-4">
            {([BLOG_SUBMISSION_TYPE.IDEA, BLOG_SUBMISSION_TYPE.DRAFT] as const).map((type) => {
              const isIdea = type === BLOG_SUBMISSION_TYPE.IDEA
              const isActive = submissionType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSubmissionType(type)}
                  className={`p-6 rounded-lg border-2 transition-all ${isActive ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200 hover:border-primary-300'}`}
                >
                  {isIdea
                    ? <Lightbulb className={`w-8 h-8 mb-3 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                    : <FileText className={`w-8 h-8 mb-3 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                  }
                  <Heading level={3} className="text-lg text-neutral-900 mb-2">
                    {isIdea ? t('typeIdea') : t('typeDraft')}
                  </Heading>
                  <p className="text-sm text-neutral-600">
                    {isIdea ? t('typeIdeaDesc') : t('typeDraftDesc')}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
          <Heading level={2} className="text-2xl text-neutral-900 mb-6">
            {submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('formHeadingIdea') : t('formHeadingDraft')}
          </Heading>

          <AIFormAssist
            formType="blog-submit"
            variant="section"
            defaultExpanded={true}
            placeholder={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('aiPlaceholderIdea') : t('aiPlaceholderDraft')}
            onFieldsFilled={handleAIFieldsFilled}
            currentData={formData as unknown as Record<string, unknown>}
            className="mb-6"
          />

          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {(['name', 'email'] as const).map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-neutral-700 mb-2">
                  {field === 'name' ? t('labelName') : t('labelEmail')}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  readOnly={isLoggedIn}
                  className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isLoggedIn ? 'bg-neutral-50 text-neutral-600 cursor-default' : ''}`}
                  placeholder={field === 'name' ? t('placeholderName') : t('placeholderEmail')}
                />
              </div>
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
              {submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('labelTitleIdea') : t('labelTitleDraft')}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              aria-required="true"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('placeholderTitleIdea') : t('placeholderTitleDraft')}
            />
          </div>

          {/* Category + Tags */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('labelCategory')}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('categoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('labelTags')}
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('placeholderTags')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-2">
              {submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('labelContentIdea') : t('labelContentDraft')}
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              aria-required="true"
              rows={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? 6 : 16}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('placeholderContentIdea') : t('placeholderContentDraft')}
            />
            {submissionType === BLOG_SUBMISSION_TYPE.DRAFT && (
              <p className="mt-2 text-sm text-neutral-500">{t('markdownHint')}</p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
            <Heading level={3} className="text-sm font-semibold text-neutral-900 mb-2">📋 {t('guidelinesTitle')}</Heading>
            <ul className="text-sm text-neutral-800 space-y-1">
              <li>• {t('guidelineOriginal')}</li>
              <li>• {t('guidelineLanguage')}</li>
              <li>• {t('guidelineExamples')}</li>
              <li>• {t('guidelineReview')}</li>
              <li>• {t('guidelineEmail')}</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">{t('requiredFields')}</div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('submittingButton')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t('submitButton')}
                </>
              )}
            </button>
          </div>

          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg">
              <p className="text-error-800 dark:text-error-400 font-medium">{t('errorTitle')}</p>
              <p className="text-error-700 dark:text-error-400 text-sm mt-1">{t('errorMessage')}</p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
