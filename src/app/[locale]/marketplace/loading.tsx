import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getTranslations } from 'next-intl/server'

export default async function MarketplaceLoading() {
  const t = await getTranslations('marketplace')
  return <LoadingSpinner text={t('loading')} />
}
