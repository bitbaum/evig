'use client'

import { Link } from '@/i18n/navigation'
import { ArrowLeft, Send, Lightbulb, FileText, Edit, CheckCircle } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import { BLOG_SUBMISSION_TYPE } from '@/config/approval-status'
import { useBlogSubmitForm } from '@/hooks/useBlogSubmitForm'
import { ROUTES } from '@/config/routes'

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
          href={ROUTES.public.blog}
          className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors bg-surface-base px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToBlog')}
        </Link>
      </div>
    </div>
  )

  if (submitStatus === 'success') {
    return (
      <div>
        {hero}
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="card-shell rounded-lg p-12">
            <CheckCircle className="w-16 h-16 text-action mx-auto mb-6" />
            <Heading level={2} className="text-2xl text-text-primary mb-3">{t('successTitle')}</Heading>
            <p className="text-text-secondary text-lg mb-2">{t('successMessage')}</p>
            <p className="text-text-tertiary text-sm mb-8">{t('successEmailNote')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="inline-flex items-center justify-center px-6 py-3 border border-action text-action rounded-lg hover:bg-action-muted transition-colors font-medium"
              >
                {t('submitAnotherButton')}
              </Button>
              <Button as={Link} href={ROUTES.public.blog} variant="primary">
                {t('toBlogButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {hero}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Submission Type Selection */}
        <div className="card-shell rounded-lg p-8 mb-8">
          <Heading level={2} className="text-2xl text-text-primary mb-6">{t('whatToSubmit')}</Heading>
          <div className="grid md:grid-cols-2 gap-4">
            {([BLOG_SUBMISSION_TYPE.IDEA, BLOG_SUBMISSION_TYPE.DRAFT] as const).map((type) => {
              const isIdea = type === BLOG_SUBMISSION_TYPE.IDEA
              const isActive = submissionType === type
              return (
                <Button
                  key={type}
                  type="button"
                  variant="ghost"
                  onClick={() => setSubmissionType(type)}
                  className={`flex-col items-start text-left h-auto p-6 rounded-lg border-2 transition-all ${isActive ? 'border-action bg-action-muted' : 'border hover:border-strong'}`}
                >
                  {isIdea
                    ? <Lightbulb className={`w-8 h-8 mb-3 ${isActive ? 'text-action' : 'text-text-muted'}`} />
                    : <FileText className={`w-8 h-8 mb-3 ${isActive ? 'text-action' : 'text-text-muted'}`} />
                  }
                  <Heading level={3} className="text-lg text-text-primary mb-2">
                    {isIdea ? t('typeIdea') : t('typeDraft')}
                  </Heading>
                  <p className="text-sm text-text-secondary">
                    {isIdea ? t('typeIdeaDesc') : t('typeDraftDesc')}
                  </p>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="card-shell rounded-lg p-8">
          <Heading level={2} className="text-2xl text-text-primary mb-6">
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
                <label htmlFor={field} className="block text-sm font-medium text-text-secondary mb-2">
                  {field === 'name' ? t('labelName') : t('labelEmail')}
                </label>
                <Input
                  type={field === 'email' ? 'email' : 'text'}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  readOnly={isLoggedIn}
                  className={isLoggedIn ? 'bg-surface-raised text-text-secondary cursor-default' : ''}
                  placeholder={field === 'name' ? t('placeholderName') : t('placeholderEmail')}
                />
              </div>
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
              {submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('labelTitleIdea') : t('labelTitleDraft')}
            </label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              aria-required="true"
              placeholder={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('placeholderTitleIdea') : t('placeholderTitleDraft')}
            />
          </div>

          {/* Category + Tags */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">
                {t('labelCategory')}
              </label>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">{t('categoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-text-secondary mb-2">
                {t('labelTags')}
              </label>
              <Input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder={t('placeholderTags')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-2">
              {submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('labelContentIdea') : t('labelContentDraft')}
            </label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              aria-required="true"
              rows={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? 6 : 16}
              className="font-mono text-sm"
              placeholder={submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('placeholderContentIdea') : t('placeholderContentDraft')}
            />
            {submissionType === BLOG_SUBMISSION_TYPE.DRAFT && (
              <p className="mt-2 text-sm text-text-tertiary">{t('markdownHint')}</p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-surface-raised border rounded-lg p-4 mb-6">
            <Heading level={3} className="text-sm font-semibold text-text-primary mb-2">📋 {t('guidelinesTitle')}</Heading>
            <ul className="text-sm text-text-primary space-y-1">
              <li>• {t('guidelineOriginal')}</li>
              <li>• {t('guidelineLanguage')}</li>
              <li>• {t('guidelineExamples')}</li>
              <li>• {t('guidelineReview')}</li>
              <li>• {t('guidelineEmail')}</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-tertiary">{t('requiredFields')}</div>
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
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
            </Button>
          </div>

          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg">
              <p className="text-error-800 dark:text-error-400 font-medium">{t('errorTitle')}</p>
              <p className="text-error-700 dark:text-error-400 text-sm mt-1">{t('errorMessage')}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
