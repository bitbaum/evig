import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IT-Hilfe - Kostenlose Tech-Reparaturhilfe | RevampIT',
  description:
    'Finde kostenlose Hilfe für deine IT-Probleme. Unsere Community aus freiwilligen Technikerinnen und Technikern hilft bei Laptop-, Smartphone- und PC-Reparaturen.',
  keywords: [
    'IT Hilfe',
    'kostenlose Reparatur',
    'Computer Hilfe',
    'Laptop Reparatur',
    'Smartphone Reparatur',
    'Community Tech Support',
    'Zürich',
  ],
  openGraph: {
    title: 'IT-Hilfe - Kostenlose Tech-Reparaturhilfe | RevampIT',
    description:
      'Kostenlose IT-Hilfe von der Community. Stelle eine Reparaturanfrage und erhalte Hilfe von erfahrenen Technikern.',
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
