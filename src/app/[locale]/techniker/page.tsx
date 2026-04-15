import type { Metadata } from 'next'
import TechnikerListClient from './TechnikerListClient'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: `Techniker finden | ${ORG.name}`,
  description:
    'Finde Community- und professionelle Techniker in deiner Nähe. Gratis-Hilfe, KulturLegi-Tarife und bezahlte IT-Dienstleistungen auf einer Plattform.',
}

export default function TechnikerPage() {
  return <TechnikerListClient />
}
