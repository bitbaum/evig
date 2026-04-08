import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marktplatz - Gebrauchte Elektronik kaufen & verkaufen | RevampIT',
  description:
    'Kaufe und verkaufe gebrauchte und aufbereitete Elektronik auf dem RevampIT Marktplatz. Nachhaltig, günstig und mit Käuferschutz.',
  keywords: [
    'gebrauchte Elektronik',
    'Second Hand Laptop',
    'aufbereitete Computer',
    'nachhaltiger Marktplatz',
    'Elektronik verkaufen',
    'refurbished Geräte',
  ],
  openGraph: {
    title: 'Marktplatz - Gebrauchte Elektronik | RevampIT',
    description:
      'Nachhaltig einkaufen: Gebrauchte und aufbereitete Elektronik mit Käuferschutz.',
    type: 'website',
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
