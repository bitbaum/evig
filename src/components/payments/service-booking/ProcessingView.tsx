'use client'

/**
 * Processing view - loading state during booking/payment
 */

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function ProcessingView() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Buchung wird verarbeitet...</h3>
        <p className="text-gray-600 text-center">
          Bitte warten Sie, während wir Ihre Buchung erstellen und die Zahlung vorbereiten.
        </p>
      </CardContent>
    </Card>
  )
}
