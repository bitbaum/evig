import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'laptop-zubehoer': '10',
  'business-laptops': '10',
  'computer-komplettsysteme': '20',
  'desktop-pcs': '20',
  'mini-pcs': '20',
  'drucker-fax-scanner': '40',
  'monitor-beamer-kamera': '30',
  'tastatur-maus-eingabegeraete': '60',
  'mainboard-cpu-ram': '50',
  'steckkarten': '50',
  'gehaeuse-netzteile-usb-hubs': '70',
  'festplatten-ssds-sticks': '50',
  'laufwerke-medien': '70',
  'externe-netzwerkgeraete': '80',
  'soundgeraete-multimedia': '70',
  'kabel-adapter-montage': '70',
}

interface LegacyShopCategoryRedirectProps {
  params: Promise<{ slug: string }>
}

/** Legacy URL — map old shop category slugs to marketplace category filters. */
export default async function LegacyShopCategoryRedirect({
  params,
}: LegacyShopCategoryRedirectProps) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()])
  const category = LEGACY_CATEGORY_MAP[slug]
  redirect({
    href: category ? `/marketplace?category=${category}` : '/marketplace',
    locale,
  })
}
