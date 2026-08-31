import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ORG } from '@/config/org';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // No `title` here on purpose, and specifically no `title.absolute`.
  //
  // This layout used to set `{ absolute: `${layoutTitle} | evig` }`, which
  // hand-rolled the suffix for the hub AND replaced the inherited
  // `title.template` for the ENTIRE /services subtree. Every child page
  // therefore shipped with no brand suffix at all — including
  // /services/ai-robotics, which rendered a bare "KI und Robotik im Betrieb".
  // Measured on the live site; no gate could see it, because `absolute` is a
  // perfectly valid metadata field.
  //
  // Dropping it lets the root template apply to every page below, and the hub
  // now sets its own title in page.tsx like any other page.
  const t = await getTranslations({ locale, namespace: 'services.meta' });
  const description = t('description');
  return {
    description,
    openGraph: {
      description,
      type: 'website',
      url: `${ORG.website}/services`,
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
