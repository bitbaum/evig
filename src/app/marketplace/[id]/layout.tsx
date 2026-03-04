import { Metadata } from 'next'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

interface ListingMeta {
  title: string
  brand: string | null
  category: string | null
  price_chf: number | null
  condition: string | null
  description: string | null
  seller_name: string | null
  image_url: string | null
}

function mapConditionToSchema(condition: string | null): string {
  switch (condition) {
    case 'new': return 'https://schema.org/NewCondition'
    case 'defect': return 'https://schema.org/DamagedCondition'
    default: return 'https://schema.org/UsedCondition'
  }
}

async function getListingMeta(id: string) {
  try {
    const result = await query<ListingMeta>(
      `SELECT l.title, l.brand, l.category, l.price_chf, l.condition, l.description,
         u.name as seller_name,
         (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as image_url
       FROM ${TABLE_NAMES.LISTINGS} l
       JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
       WHERE l.id = $1 AND l.status = 'active'`,
      [id]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingMeta(id)

  if (!listing) {
    return { title: 'Inserat nicht gefunden | RevampIT' }
  }

  const price = listing.price_chf ? `CHF ${listing.price_chf}` : 'Preis auf Anfrage'
  const brand = listing.brand && !listing.title.startsWith(listing.brand) ? `${listing.brand} ` : ''
  return {
    title: `${brand}${listing.title} | RevampIT Marktplatz`,
    description: `${brand}${listing.title} — ${price}. Gebrauchte Elektronik nachhaltig kaufen auf dem RevampIT Marktplatz.`,
    openGraph: {
      title: `${brand}${listing.title} | RevampIT Marktplatz`,
      description: `${price} — Nachhaltig einkaufen bei RevampIT.`,
      type: 'website',
      ...(listing.image_url && {
        images: [{ url: listing.image_url, alt: `${brand}${listing.title}` }],
      }),
    },
  }
}

export default async function MarketplaceDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getListingMeta(id)

  if (!listing) return children

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revamp-it.ch'
  const brand = listing.brand && !listing.title.startsWith(listing.brand) ? `${listing.brand} ` : ''
  const isGratis = listing.price_chf !== null && Number(listing.price_chf) === 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brand}${listing.title}`,
    ...(listing.description && { description: listing.description.substring(0, 500) }),
    ...(listing.image_url && { image: listing.image_url }),
    ...(listing.brand && { brand: { '@type': 'Brand', name: listing.brand } }),
    offers: {
      '@type': 'Offer',
      price: isGratis ? '0' : String(listing.price_chf),
      priceCurrency: 'CHF',
      availability: 'https://schema.org/InStock',
      itemCondition: mapConditionToSchema(listing.condition),
      url: `${baseUrl}/marketplace/${id}`,
      ...(listing.seller_name && {
        seller: { '@type': 'Organization', name: listing.seller_name },
      }),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
