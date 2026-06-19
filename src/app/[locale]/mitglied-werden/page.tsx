// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Award, Vote, Users, Heart, CheckCircle, User as UserIcon } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { ORG, MEMBERSHIP } from '@/config/org'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MembershipApplicationForm } from '@/components/membership/MembershipApplicationForm'
import { getTranslations } from 'next-intl/server'

interface MitgliedWerdenPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MitgliedWerdenPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'mitgliedWerden' })
  return {
    title: { absolute: `${t('meta.title')} | ${ORG.name}` },
    description: t('meta.description', { orgName: ORG.name, fee: MEMBERSHIP.fees.regular }),
    openGraph: {
      title: `${t('meta.title')} | ${ORG.name}`,
      description: t('meta.description', { orgName: ORG.name, fee: MEMBERSHIP.fees.regular }),
      type: 'website',
    },
  }
}

// Icons are positional — parallel to whatYouGet translation array
const WHAT_YOU_GET_ICONS = [Vote, Users, Heart]

async function getMemberStatus() {
  const session = await auth()
  if (!session?.user?.id) return { isLoggedIn: false, isMember: false }

  try {
    const [user] = await db
      .select({ isMember: users.isMember, memberSince: users.memberSince, memberType: users.memberType })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    return {
      isLoggedIn: true,
      isMember: user?.isMember ?? false,
      memberSince: user?.memberSince,
      memberType: user?.memberType,
    }
  } catch {
    // Membership columns may not exist yet if migration is pending
    return { isLoggedIn: true, isMember: false }
  }
}

export default async function MitgliedWerdenPage({ params }: MitgliedWerdenPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'mitgliedWerden' })
  const status = await getMemberStatus()

  const whatYouGet = t.raw('whatYouGet') as Array<{ title: string; description: string }>
  const faqItems = t.raw('faq.items') as Array<{ question: string; answer: string }>

  return (
    <div className="bg-canvas">
      <section className="border-b border-subtle py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="ui-public-eyebrow">{t('hero.title').toUpperCase()}</div>
          <Award className="w-10 h-10 text-action mx-auto mt-6 mb-4" aria-hidden="true" />
          <h1 className="ui-public-display-lg">{t('hero.title')}</h1>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('hero.body')}</p>
        </div>
      </section>

      {/* What you get */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {whatYouGet.map((item, index) => {
              const Icon = WHAT_YOU_GET_ICONS[index]
              return (
                <article key={index} className="ui-public-card">
                  <Icon className="h-6 w-6 text-action mb-3" aria-hidden="true" />
                  <h3 className="ui-public-card-title">{item.title}</h3>
                  <p className="ui-public-card-body">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Form or status */}
      <section className="ui-public-band py-10 sm:py-14">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="card-shell p-6 sm:p-8">
            {status.isMember ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-action mx-auto mb-4" aria-hidden="true" />
                <Heading level={2} className="ui-public-display-md mb-2">{t('member.title')}</Heading>
                <p className="ui-public-section-lede">{t('member.thanks')}</p>
                {status.memberSince && (
                  <p className="ui-public-meta mt-2 mb-6">
                    {t('member.since', { date: new Date(status.memberSince).toLocaleDateString(locale) })}
                  </p>
                )}
                <Link href="/dashboard" className="ui-public-cta inline-flex items-center gap-2">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  {t('member.dashboard')}
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Heading level={2} className="ui-public-display-md">{t('form.heading')}</Heading>
                  <p className="ui-public-meta mt-2">{t('form.subtitle')}</p>
                </div>
                <MembershipApplicationForm />
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="ui-public-eyebrow">{t('faq.heading').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-md mt-3">{t('faq.heading')}</Heading>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <article key={index} className="ui-public-card">
                <h3 className="ui-public-card-title text-base">{item.question}</h3>
                <p className="ui-public-card-body">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
