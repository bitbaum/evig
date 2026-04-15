import { getTranslations } from 'next-intl/server'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default async function ITHilfeLoading() {
  const t = await getTranslations('itHelp')
  return <LoadingSpinner text={t('loading')} />
}
