import { getTranslations } from 'next-intl/server'
import { TechnologiesClient } from './TechnologiesClient'
import {
  Globe,
  Code,
  Palette,
  Shield,
  Database,
  Cloud,
  Layers,
} from 'lucide-react'

export interface TechItem {
  name: string
  description: string
  iconKey: string
  category: string
  benefits: string[]
  url: string
}

const TECH_DEFS = [
  { name: 'Next.js & React', iconKey: 'Code', category: 'Frontend', url: 'https://nextjs.org', tKey: 'nextjs' },
  { name: 'Tailwind CSS', iconKey: 'Palette', category: 'Frontend', url: 'https://tailwindcss.com', tKey: 'tailwind' },
  { name: 'Supabase', iconKey: 'Database', category: 'Backend', url: 'https://supabase.com', tKey: 'supabase' },
  { name: 'Strapi', iconKey: 'Layers', category: 'CMS', url: 'https://strapi.io', tKey: 'strapi' },
  { name: 'Payload CMS', iconKey: 'Shield', category: 'CMS', url: 'https://payloadcms.com', tKey: 'payload' },
  { name: 'Tina CMS', iconKey: 'Code', category: 'CMS', url: 'https://tina.io', tKey: 'tina' },
  { name: 'WordPress', iconKey: 'Globe', category: 'CMS', url: 'https://wordpress.org', tKey: 'wordpress' },
  { name: 'Joomla', iconKey: 'Globe', category: 'CMS', url: 'https://www.joomla.org', tKey: 'joomla' },
  { name: 'WooCommerce', iconKey: 'Globe', category: 'E-Commerce', url: 'https://woocommerce.com', tKey: 'woocommerce' },
  { name: 'Shopware 6', iconKey: 'Globe', category: 'E-Commerce', url: 'https://www.shopware.com', tKey: 'shopware' },
  { name: '', iconKey: 'Cloud', category: 'Infrastruktur', url: 'https://vercel.com', tKey: 'hosting' },
] as const

export async function TechnologiesSection() {
  const t = await getTranslations('services.webDesign.technologies')

  const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    Code, Palette, Database, Layers, Shield, Globe, Cloud,
  }

  const technologies: TechItem[] = TECH_DEFS.map((def) => ({
    name: def.tKey === 'hosting' ? t('items.hosting.name') : def.name,
    description: t(`items.${def.tKey}.description`),
    iconKey: def.iconKey,
    category: def.category,
    benefits: t.raw(`items.${def.tKey}.benefits`) as string[],
    url: def.url,
  }))

  const allLabel = t('allCategories')
  const uniqueCategories = [allLabel, ...Array.from(new Set(technologies.map(tech => tech.category))).sort()]

  return (
    <TechnologiesClient
      technologies={technologies}
      categories={uniqueCategories}
      allLabel={allLabel}
      labels={{
        title: t('title'),
        subtitle: t('subtitle'),
        filterLabel: t('filterLabel'),
        visitWebsite: t('visitWebsite'),
        showing: t('showing', { count: technologies.length, total: technologies.length }),
        showingFiltered: (count: number, category: string) =>
          t('showingFiltered', { count, total: technologies.length, category }),
      }}
      iconMap={iconMap}
    />
  )
}
