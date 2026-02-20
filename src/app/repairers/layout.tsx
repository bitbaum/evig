import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reparateure finden | RevampIT',
  description:
    'Finden Sie zertifizierte Reparateure in Ihrer Nähe für Laptop-, Smartphone-, Tablet- und PC-Reparaturen. Bewertungen, Preise und Online-Buchung.',
  keywords: [
    'Reparateur finden',
    'Elektronik Reparatur',
    'Laptop Reparatur Zürich',
    'Smartphone Reparatur',
    'PC Reparatur',
    'zertifizierte Reparateure',
  ],
  openGraph: {
    title: 'Reparateure finden | RevampIT',
    description:
      'Zertifizierte Reparateure für alle Elektronik-Geräte. Bewertungen lesen, Preise vergleichen und online buchen.',
    type: 'website',
  },
}

export default function RepairersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
