'use client'

/**
 * Error view for booking failures
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorViewProps {
  error: string
  onRetry: () => void
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <CardTitle className="text-red-800">Fehler bei der Buchung</CardTitle>
        <CardDescription>
          Es ist ein Fehler aufgetreten. Bitte versuche es erneut.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onRetry} className="w-full">
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  )
}
