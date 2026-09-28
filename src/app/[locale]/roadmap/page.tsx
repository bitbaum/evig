import type { Metadata } from 'next';
import { Map as MapIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/layout/Section';
import { RoadmapRecord } from '@/components/roadmap/RoadmapRecord';
import { fetchDevelopmentProfile } from '@/lib/development-records';

/**
 * /roadmap — evig's public roadmap, rendered from the fleet map.
 *
 * The record is ROADMAP.md in this repository; Loki's map ingests it and this
 * page reads the map (src/config/development-records.ts). No local copy: when
 * the map is unreachable the page says so instead of showing stale prose.
 */

interface RoadmapPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RoadmapPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'roadmap' });
  const title = t('meta.title');
  const description = t('meta.description');
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { locale } = await params;
  const [t, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'roadmap' }),
    fetchDevelopmentProfile(),
  ]);

  return (
    <div className="min-h-screen">
      <PageHero
        theme="about"
        icon={MapIcon}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />
      <Section density="compact">
        <div className="mx-auto max-w-4xl">
          <RoadmapRecord profile={profile} locale={locale} />
        </div>
      </Section>
    </div>
  );
}
