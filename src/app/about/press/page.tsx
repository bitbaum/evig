import { Metadata } from 'next'
import PressPageContent from './content'

export const metadata: Metadata = {
  title: 'Presse & Medien - RevampIT',
  description: 'Medienberichte und Presseartikel über RevampIT. Entdecken Sie, was SRF, Beobachter und andere über uns geschrieben haben.',
}

export default function PressPage() {
  return <PressPageContent />
}
