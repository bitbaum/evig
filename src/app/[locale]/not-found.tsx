import { Link } from '@/i18n/navigation'
import { Search, Home } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-6">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>
        <Heading level={1} className="text-2xl text-neutral-900 mb-2">{t('title')}</Heading>
        <p className="text-neutral-600 mb-8">
          {t('description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-neutral-700 font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            {t('reportProblem')}
          </Link>
        </div>
      </div>
    </div>
  )
}
