import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Computer Reparatur & IT Services | RevampIT',
  description: 'Professionelle Computer-Reparaturen, Webentwicklung, Datenrettung, Linux-Support und Hardware-Recycling. Günstige und nachhaltige Lösungen für deine Technik.',
  openGraph: {
    title: 'Computer Reparatur & IT Services | RevampIT',
    description: 'Professionelle Computer-Reparaturen, Webentwicklung, Datenrettung, Linux-Support und Hardware-Recycling. Günstige und nachhaltige Lösungen für deine Technik.',
    type: 'website',
    url: 'https://revamp-it.ch/services',
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 