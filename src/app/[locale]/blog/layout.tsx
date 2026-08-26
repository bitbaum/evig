import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  // No `title` here on purpose. Both this layout and the index page below it
  // set one, and the tab ended up reading a bare "Blog" with no "| evig" —
  // the only page on the site missing the suffix. The page owns its title;
  // the layout contributes the description and the OG defaults.
  const t = await getTranslations({ locale, namespace: 'blog.meta' })
  const description = t('description')
  return {
    description,
    openGraph: {
      description,
      type: 'website',
    },
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
