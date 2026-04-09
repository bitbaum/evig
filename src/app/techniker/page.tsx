import type { Metadata } from 'next'
import TechnikerListClient from './TechnikerListClient'

export const metadata: Metadata = {
  title: 'Techniker finden | RevampIT',
  description:
    'Finde Community- und professionelle Techniker in deiner Nähe. Gratis-Hilfe, KulturLegi-Tarife und bezahlte IT-Dienstleistungen auf einer Plattform.',
}

export default function TechnikerPage() {
  return <TechnikerListClient />
}
