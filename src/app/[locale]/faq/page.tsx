import type { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { safeJsonLd } from '@/lib/seo/json-ld'

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
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <FAQSchema groups={groups} />
      <PageHero
        theme="faq"
        icon={HelpCircle}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">

            <div className="space-y-8 sm:space-y-10">
              {groups.map((group) => (
                <section key={group.category}>
                  <Heading level={2} className="text-lg sm:text-xl text-gray-800 mb-3 sm:mb-4">
                    {group.category}
                  </Heading>
                  <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                    {group.items.map((item, idx) => (
                      <details key={idx} className="group p-4 sm:p-5 open:bg-gray-50/60">
                        <summary className="cursor-pointer list-none flex items-start justify-between">
                          <span className="text-sm sm:text-base text-gray-900 font-medium pr-2">
                            {item.q}
                          </span>
                          <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                            ▾
                          </span>
                        </summary>
                        <div className="mt-3 text-gray-700 text-xs sm:text-sm">
                          <p>{item.a}</p>
                          {item.link && (
                            <p className="mt-2">
                              <Link
                                href={item.link.href}
                                className="text-blue-600 hover:text-blue-800 underline"
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

            <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 text-xs sm:text-sm">
              <p className="text-gray-800">
                {t('notListed')}
                <span className="ml-2">
                  <Link href="/contact" className="text-green-700 hover:text-green-800 underline font-medium">
                    {t('contactTeam')}
                  </Link>
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
