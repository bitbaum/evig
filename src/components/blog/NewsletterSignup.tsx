'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Mail, Heart, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe';
import Heading from '@/components/ui/Heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconBadge } from '@/components/ui/IconBadge';
import { ROUTES } from '@/config/routes';

export default function NewsletterSignup() {
  const t = useTranslations('components.newsletterSignup');
  const [email, setEmail] = useState('');
  const { status, errorMsg, subscribe } = useNewsletterSubscribe(t('networkError'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await subscribe({ email });
    if (ok) setEmail('');
  };

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12">
      <div className="border-t border-b py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <IconBadge icon={Mail} shape="circle" size="lg" className="mb-4" />
          <Heading level={3} className="text-2xl font-bold text-text-primary mb-3">
            {t('title')}
          </Heading>
          <p className="text-lg text-text-secondary leading-relaxed">{t('subtitle')}</p>
        </div>

        {/* Newsletter Promise */}
        <div className="grid sm:grid-cols-3 gap-4 text-sm mb-8">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-action shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">{t('free')}</p>
              <p className="text-text-secondary">{t('freeDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-action shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">{t('noAds')}</p>
              <p className="text-text-secondary">{t('noAdsDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-action shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">{t('unsubscribe')}</p>
              <p className="text-text-secondary">{t('unsubscribeDesc')}</p>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        {status === 'success' ? (
          <div className="bg-action-muted border border-strong rounded-lg p-6 text-center">
            <IconBadge icon={Check} shape="circle" size="md" className="mb-3" />
            <p className="text-action font-semibold mb-1">{t('successMessage')}</p>
            <p className="text-action text-sm">{t('confirmEmail')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('placeholder')}
                required
                aria-required="true"
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                disabled={status === 'loading'}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={status === 'loading'}
                className="whitespace-nowrap"
              >
                {status === 'loading' ? t('sending') : t('subscribe')}
              </Button>
            </div>

            {status === 'error' && (
              <p id="newsletter-error" className="text-error-600 text-sm">
                {errorMsg}
              </p>
            )}

            <p className="text-xs text-text-tertiary text-center">{t('privacy')}</p>
          </form>
        )}

        {/* Community Support */}
        <div className="mt-8 pt-8 border-t text-center">
          <div className="flex items-center justify-center gap-2 text-text-secondary mb-2">
            <Heart className="w-5 h-5 text-error-500" />
            <p className="text-sm">{t('communityTitle')}</p>
          </div>
          <p className="text-sm text-text-secondary mb-4">{t('communityDesc')}</p>
          <Link
            href={ROUTES.public.donate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary border border-default rounded-lg hover:bg-surface-raised transition-colors"
          >
            <Heart className="w-4 h-4" />
            {t('supportButton')}
          </Link>
        </div>
      </div>
    </div>
  );
}
