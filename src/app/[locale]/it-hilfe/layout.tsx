import { Metadata } from 'next'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: `IT-Hilfe - Community-basierte Tech-Reparatur | ${ORG.name}`,
  description:
    'Finde Hilfe für deine IT-Probleme. Unsere Community aus Technikerinnen und Technikern hilft bei Laptop-, Smartphone- und PC-Reparaturen — kostenlos oder gegen faire Bezahlung.',
  keywords: [
    'IT Hilfe',
    'Computer Reparatur',
    'Computer Hilfe',
    'Laptop Reparatur',
    'Smartphone Reparatur',
    'Community Tech Support',
    'Zürich',
  ],
  openGraph: {
    title: `IT-Hilfe - Community-basierte Tech-Reparatur | ${ORG.name}`,
    description:
      'IT-Hilfe von der Community. Stelle eine Reparaturanfrage und erhalte Hilfe von erfahrenen Technikern.',
    type: 'website',
  },
}

export default function ITHilfeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
