import { getTranslations } from 'next-intl/server'
import { GalleryClient } from './GalleryClient'
import { ogFor } from '../og-images'

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.gallery') as { meta: { title: string; description: string } }
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('gallery', m.meta),
  }
}

export default function UpcyclingGalleryPage() {
  return <GalleryClient />
}
