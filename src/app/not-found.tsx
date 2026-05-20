// Force runtime rendering — lucide imports land in the shared SSR bundle where
// Next.js 16 Turbopack leaves React null during parallel static-generation workers.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-6">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>
        <Heading level={1} className="text-2xl text-neutral-900 mb-2">Seite nicht gefunden</Heading>
        <p className="text-neutral-600 mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button as={Link} href="/" variant="primary">
            <Home className="w-4 h-4" />
            Zur Startseite
          </Button>
          <Button as={Link} href="/contact" variant="outline">
            Problem melden
          </Button>
        </div>
      </div>
    </div>
  )
}
