// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { HelpCircle } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { PageShell } from '@/components/layout/PageShell'

interface FAQPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

interface FAQItem {
  q: string
  a: string
  link?: { href: string; label: string }
}

interface FAQGroup {
  category: string
  items: FAQItem[]
}

function FAQSchema({ groups }: { groups: FAQGroup[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups
      .flatMap((g) => g.items)
      .slice(0, 20)
      .map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })

  // Groups come from the messages JSON (SSOT for translated content)
  const groups = t.raw('groups') as FAQGroup[]

  return (
    <>
      <FAQSchema groups={groups} />
      <PageHero
        theme="faq"
        icon={HelpCircle}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />
      <section className="py-12 sm:py-16">
        <PageShell maxWidth="5xl" py="">
            <div className="space-y-10 sm:space-y-12">
              {groups.map((group) => (
                <section key={group.category}>
                  <div className="ui-public-eyebrow mb-3">{group.category.toUpperCase()}</div>
                  <Heading level={2} className="ui-public-display-md mb-4">
                    {group.category}
                  </Heading>
                  <div className="divide-y divide-subtle rounded-2xl border border-subtle bg-surface-base overflow-hidden">
                    {group.items.map((item, idx) => (
                      <details key={idx} className="group p-4 sm:p-5 open:bg-surface-raised/60">
                        <summary className="cursor-pointer list-none flex items-start justify-between">
                          <span className="text-sm sm:text-base text-text-primary font-medium pr-2">
                            {item.q}
                          </span>
                          <span className="ml-4 text-text-muted group-open:rotate-180 transition-transform shrink-0">
                            ▾
                          </span>
                        </summary>
                        <div className="mt-3 text-text-secondary text-xs sm:text-sm">
                          <p>{item.a}</p>
                          {item.link && (
                            <p className="mt-2">
                              <Link
                                href={item.link.href}
                                className="text-action hover:text-action underline"
                              >
                                {item.link.label}
                              </Link>
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="ui-public-band mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl text-sm">
              <p className="ui-public-prose-strong">
                {t('notListed')}
                <span className="ml-2">
                  <Link href="/contact" className="text-action hover:underline underline-offset-2 font-medium">
                    {t('contactTeam')}
                  </Link>
                </span>
              </p>
            </div>
        </PageShell>
      </section>
    </>
  )
}
