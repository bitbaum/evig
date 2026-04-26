import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { sellerProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ORG } from '@/config/org'
import { APP_URL } from '@/config/urls'
import { safeJsonLd } from '@/lib/seo/json-ld'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface SellerMeta {
  display_name: string | null
  user_name: string | null
  bio: string | null
  city: string | null
  canton: string | null
  avatar_url: string | null
  total_listings: number | null
}

async function getSellerMeta(id: string): Promise<SellerMeta | null> {
  try {
    const [row] = await db
      .select({
        display_name: sellerProfiles.displayName,
        user_name: users.name,
        bio: sellerProfiles.bio,
        city: sellerProfiles.city,
        canton: sellerProfiles.canton,
        avatar_url: sellerProfiles.avatarUrl,
        total_listings: sellerProfiles.totalListings,
      })
      .from(sellerProfiles)
      .innerJoin(users, eq(sellerProfiles.userId, users.id))
      .where(eq(sellerProfiles.userId, id))
    return row ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'techniker.seller' })

  if (!UUID_RE.test(id)) {
    return { title: `${t('meta.titleFallback')} | ${ORG.name}` }
  }

  const seller = await getSellerMeta(id)
  if (!seller) {
    return { title: `${t('meta.titleFallback')} | ${ORG.name}` }
  }

  const name = seller.display_name || seller.user_name || ORG.name
  const count = seller.total_listings ?? 0
  const title = t('meta.title', { name })
  const description = t('meta.description', { name, count })
  const location = seller.city
    ? `${seller.city}${seller.canton ? `, ${seller.canton}` : ''}`
    : null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(seller.avatar_url && {
        images: [{ url: seller.avatar_url, alt: name }],
      }),
    },
    alternates: {
      canonical: `${APP_URL}/sellers/${id}`,
    },
    other: location ? { 'profile:location': location } : undefined,
  }
}

export default async function SellerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  if (!UUID_RE.test(id)) return <>{children}</>

  const seller = await getSellerMeta(id)
  if (!seller) return <>{children}</>

  const name = seller.display_name || seller.user_name || ORG.name

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(seller.bio && { description: seller.bio }),
    ...(seller.avatar_url && { image: seller.avatar_url }),
    ...(seller.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: seller.city,
        ...(seller.canton && { addressRegion: seller.canton }),
        addressCountry: 'CH',
      },
    }),
    url: `${APP_URL}/sellers/${id}`,
    memberOf: {
      '@type': 'Organization',
      name: ORG.name,
      url: APP_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      {children}
    </>
  )
}
