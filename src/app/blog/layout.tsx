import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Neuigkeiten & Wissen | RevampIT',
  description:
    'Artikel über nachhaltige Technologie, Reparatur-Tipps, Open-Source und die Circular Economy. Bleiben Sie informiert mit dem RevampIT Blog.',
  keywords: [
    'Technologie Blog',
    'Reparatur Tipps',
    'nachhaltige Technologie',
    'Open Source',
    'Circular Economy',
    'E-Waste',
  ],
  openGraph: {
    title: 'Blog - Neuigkeiten & Wissen | RevampIT',
    description:
      'Artikel und Tipps zu nachhaltiger Technologie, Reparatur und Open Source.',
    type: 'website',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
