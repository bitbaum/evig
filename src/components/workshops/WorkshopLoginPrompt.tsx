'use client'

import { Link } from '@/i18n/navigation'
import { LogIn, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export function WorkshopLoginPrompt() {
  const t = useTranslations('workshops.detail')
  const tCommon = useTranslations('common')

  return (
    <div>
      <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">{t('loginHeading')}</Heading>

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
        <div className="flex items-center text-neutral-800 mb-2">
          <LogIn className="w-5 h-5 mr-2" />
          <span className="font-medium">{t('loginRequired')}</span>
        </div>
        <p className="text-neutral-700 text-sm">
          {t('loginPrompt')}
        </p>
      </div>

      <div className="space-y-3">
        <Button as={Link} href={ROUTES.public.login} variant="primary" className="w-full">
          <LogIn className="w-4 h-4 mr-2" />
          {tCommon('signIn')}
        </Button>

        <Button as={Link} href={ROUTES.public.register} variant="outline" className="w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          {tCommon('signUp')}
        </Button>
      </div>
    </div>
  )
}
