import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getTranslations } from 'next-intl/server'

export default async function SearchLoading() {
  const t = await getTranslations('shop')
  return <LoadingSpinner text={t('search.loadingText')} />
}
