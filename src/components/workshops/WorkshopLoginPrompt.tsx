'use client'

import Link from 'next/link'
import { LogIn, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

export function WorkshopLoginPrompt() {
  const t = useTranslations('workshops.detail')
  const tCommon = useTranslations('common')

  return (
    <div>
      <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">{t('loginHeading')}</Heading>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center text-blue-800 mb-2">
          <LogIn className="w-5 h-5 mr-2" />
          <span className="font-medium">{t('loginRequired')}</span>
        </div>
        <p className="text-blue-700 text-sm">
          {t('loginPrompt')}
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/auth/login"
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {tCommon('signIn')}
        </Link>

        <Link
          href="/auth/register"
          className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {tCommon('signUp')}
        </Link>
      </div>
    </div>
  )
}
