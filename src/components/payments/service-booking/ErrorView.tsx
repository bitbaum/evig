'use client'

/**
 * Error view for booking failures
 */

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorViewProps {
  error: string
  onRetry: () => void
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  const t = useTranslations('services.payment')
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <AlertCircle className="w-16 h-16 text-error-600 mx-auto mb-4" />
        <CardTitle className="text-error-800">{t('errorTitle')}</CardTitle>
        <CardDescription>
          {t('errorDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onRetry} className="w-full">
          {t('retryButton')}
        </Button>
      </CardContent>
    </Card>
  )
}
