import type { Metadata } from 'next'
import Link from 'next/link'
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
    title: `${t('meta.title')} | ${ORG.name}`,
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
    <div className="bg-white">
      {/* Compact header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <Heading level={1} className="text-2xl sm:text-3xl text-gray-900 mb-3">
            {t('hero.title')}
          </Heading>
          <p className="text-gray-600 max-w-xl mx-auto">
            {t('hero.body')}
          </p>
        </div>
      </div>

      {/* What you get */}
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {whatYouGet.map((item, index) => {
              const Icon = WHAT_YOU_GET_ICONS[index]
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <Icon className="h-6 w-6 text-green-600 mb-3" aria-hidden="true" />
                  <Heading level={3} className="text-base text-gray-900">{item.title}</Heading>
                  <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form or status */}
      <div className="bg-green-50 py-10 sm:py-14">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            {status.isMember ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <Heading level={2} className="text-xl text-gray-900 mb-2">{t('member.title')}</Heading>
                <p className="text-gray-600 mb-1">
                  {t('member.thanks')}
                </p>
                {status.memberSince && (
                  <p className="text-sm text-gray-500 mb-6">
                    {t('member.since', { date: new Date(status.memberSince).toLocaleDateString(locale) })}
                  </p>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
                >
                  <UserIcon className="h-4 w-4" />
                  {t('member.dashboard')}
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Heading level={2} className="text-xl text-gray-900">
                    {t('form.heading')}
                  </Heading>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('form.subtitle')}
                  </p>
                </div>
                <MembershipApplicationForm />
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Heading level={2} className="text-xl text-gray-900 text-center mb-8">
            {t('faq.heading')}
          </Heading>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <Heading level={3} className="text-sm font-bold text-gray-900">{item.question}</Heading>
                <p className="mt-1.5 text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
