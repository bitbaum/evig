'use client'

/**
 * Processing view - loading state during booking/payment
 */

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

export function ProcessingView() {
  const t = useTranslations('services.payment')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <Heading level={3} className="text-lg font-semibold mb-2">{t('processingTitle')}</Heading>
        <p className="text-neutral-600 text-center">
          {t('processingDesc')}
        </p>
      </CardContent>
    </Card>
  )
}
