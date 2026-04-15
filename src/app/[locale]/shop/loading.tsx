import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getTranslations } from 'next-intl/server'

export default async function ShopLoading() {
  const t = await getTranslations('shop')
  return <LoadingSpinner text={t('loading.text')} />
}
