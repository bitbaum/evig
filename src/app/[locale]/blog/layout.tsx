import { Metadata } from 'next'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: `Blog - Neuigkeiten & Wissen | ${ORG.name}`,
  description:
    `Artikel über nachhaltige Technologie, Reparatur-Tipps, Open-Source und die Circular Economy. Bleib informiert mit dem ${ORG.name} Blog.`,
  keywords: [
    'Technologie Blog',
    'Reparatur Tipps',
    'nachhaltige Technologie',
    'Open Source',
    'Circular Economy',
    'E-Waste',
  ],
  openGraph: {
    title: `Blog - Neuigkeiten & Wissen | ${ORG.name}`,
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
