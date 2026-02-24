import { Metadata } from 'next'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

async function getListingMeta(id: string) {
  try {
    const result = await query<{
      title: string
      brand: string | null
      category: string | null
      price_chf: number | null
      image_url: string | null
    }>(
      `SELECT l.title, l.brand, l.category, l.price_chf,
         (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as image_url
       FROM ${TABLE_NAMES.LISTINGS} l
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
  const brand = listing.brand ? `${listing.brand} ` : ''
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

export default function MarketplaceDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
