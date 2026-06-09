import { getTranslations } from 'next-intl/server'
import { GalleryClient } from './GalleryClient'

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.gallery') as { meta: { title: string; description: string } }
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default function UpcyclingGalleryPage() {
  return <GalleryClient />
}
