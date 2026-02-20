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
    }>(
      `SELECT title, brand, category, price_chf FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status = 'active'`,
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
