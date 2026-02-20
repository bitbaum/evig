import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workshops - Reparieren lernen | RevampIT',
  description:
    'Lernen Sie in unseren Workshops, wie Sie Elektronik selbst reparieren. Von Löten bis Software-Installation — praxisnah und nachhaltig.',
  keywords: [
    'Reparatur Workshop',
    'Elektronik reparieren lernen',
    'Löt-Workshop',
    'Repair Café',
    'nachhaltige Workshops Zürich',
    'DIY Reparatur',
  ],
  openGraph: {
    title: 'Workshops - Reparieren lernen | RevampIT',
    description:
      'Praxisnahe Workshops für Elektronik-Reparatur. Lernen Sie löten, diagnostizieren und reparieren.',
    type: 'website',
  },
}

export default function WorkshopsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
