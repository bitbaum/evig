'use client'

import { Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getAllSkills, OFFER_MIN_CHARS, OFFER_MAX_CHARS } from '@/config/it-hilfe'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface OfferFormProps {
  showForm: boolean
  onShowForm: () => void
  offerMessage: string
  onMessageChange: (value: string) => void
  offerEstimatedTime: string
  onEstimatedTimeChange: (value: string) => void
  offerCompensation: string
  onCompensationChange: (value: string) => void
  offerAmount: string
  onAmountChange: (value: string) => void
  offerSkills: string[]
  onSkillToggle: (skillId: string) => void
  submitting: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function OfferForm({
  showForm,
  onShowForm,
  offerMessage,
  onMessageChange,
  offerEstimatedTime,
  onEstimatedTimeChange,
  offerCompensation,
  onCompensationChange,
  offerAmount,
  onAmountChange,
  offerSkills,
  onSkillToggle,
  submitting,
  error,
  onSubmit,
  onCancel,
}: OfferFormProps) {
  const t = useTranslations('itHelp.offer')

  return (
    <div className="card-shell p-6">
      {!showForm ? (
        <Button onClick={onShowForm} variant="primary" className="w-full">
          <Send className="w-5 h-5" aria-hidden="true" />
          {t('offerButton')}
        </Button>
      ) : (
        <form onSubmit={onSubmit}>
          <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('heading')}</Heading>

          {error && (
            <div id="offer-error" className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="offer-message" className="block text-sm font-medium text-text-secondary mb-1">
                {t('messageLabel')} <span className="text-error-500">*</span>
              </label>
              <Textarea
                id="offer-message"
                value={offerMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={t('messagePlaceholder')}
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'offer-error' : undefined}
                minLength={OFFER_MIN_CHARS}
                maxLength={OFFER_MAX_CHARS}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offer-estimated-time" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('estimatedTimeLabel')}
                </label>
                <Input
                  id="offer-estimated-time"
                  type="text"
                  value={offerEstimatedTime}
                  onChange={(e) => onEstimatedTimeChange(e.target.value)}
                  placeholder={t('estimatedTimePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="offer-amount" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('amountLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary text-sm">CHF</span>
                  <Input
                    id="offer-amount"
                    type="number"
                    min="0"
                    step="5"
                    value={offerAmount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder={t('amountPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="offer-compensation" className="block text-sm font-medium text-text-secondary mb-1">
                {t('compensationLabel')}
              </label>
              <Input
                id="offer-compensation"
                type="text"
                value={offerCompensation}
                onChange={(e) => onCompensationChange(e.target.value)}
                placeholder={t('compensationPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('skillsLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {getAllSkills().map((skill) => (
                  <Button
                    key={skill.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSkillToggle(skill.id)}
                    className={`px-3 py-3 min-h-touch rounded-full text-sm h-auto ${
                      offerSkills.includes(skill.id)
                        ? 'bg-action-muted text-action border-2 border-action'
                        : 'bg-surface-raised text-text-secondary border-2 border-transparent hover:bg-surface-overlay'
                    }`}
                  >
                    {skill.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" onClick={onCancel} variant="secondary">
              {t('cancelButton')}
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || offerMessage.length < 20}>
              {submitting ? t('submittingButton') : t('sendButton')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
