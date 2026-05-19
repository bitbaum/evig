import { Link } from '@/i18n/navigation'
import { Search, Home } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-6">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>
        <Heading level={1} className="text-2xl text-neutral-900 mb-2">{t('title')}</Heading>
        <p className="text-neutral-600 mb-8">
          {t('description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button as={Link} href="/" variant="primary">
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Button>
          <Button as={Link} href="/contact" variant="outline">
            {t('reportProblem')}
          </Button>
        </div>
      </div>
    </div>
  )
}
