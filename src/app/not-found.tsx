// Force runtime rendering — lucide imports land in the shared SSR bundle where
// Next.js 16 Turbopack leaves React null during parallel static-generation workers.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'
import Heading from '@/components/ui/Heading'

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
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-neutral-700 font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            Problem melden
          </Link>
        </div>
      </div>
    </div>
  )
}
