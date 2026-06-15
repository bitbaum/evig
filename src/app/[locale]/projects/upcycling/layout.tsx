import { getTranslations } from 'next-intl/server'
import {
  UPCYCLING_NAV_LABEL_KEYS,
  UPCYCLING_NAV_ROUTE_KEYS,
  UPCYCLING_ROUTES,
} from '@/config/upcycling-routes'
import { UpcyclingInterestBand } from './UpcyclingInterestBand'
import { UpcyclingNextStepBand } from './UpcyclingNextStepBand'
import { UpcyclingSubNav } from './UpcyclingSubNav'

/**
 * Shared layout for the Monitor-Upcycling mini-site.
 *
 * Renders a sticky sub-nav so visitors can move freely between
 * Overview / Applications / Gallery / Build-Your-Own without going back
 * to the main project index. Treated as a sub-site by convention; the
 * URL prefix is intentionally portable so a future split to its own
 * domain is a redirect, not a refactor.
 */

type SubNavMessages = {
  brand: string
  overview: string
  applications: string
  gallery: string
  buildYourOwn: string
  wirkung: string
  businessPlan: string
  status: string
}

type InterestMessages = {
  eyebrow: string
  heading: string
  body: string
}

export default async function UpcyclingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('projects')
  const nav = t.raw('upcycling.nav') as SubNavMessages
  const interest = t.raw('upcycling.interestCta') as InterestMessages
  const nextStep = t.raw('upcycling.nextStep') as Record<
    string,
    { eyebrow: string; title: string; body: string; cta: string }
  >

  const items = UPCYCLING_NAV_ROUTE_KEYS.map((routeKey) => ({
    href: UPCYCLING_ROUTES[routeKey],
    label: nav[UPCYCLING_NAV_LABEL_KEYS[routeKey]],
  }))

  return (
    <>
      <UpcyclingSubNav items={items} brand={nav.brand} />
      {children}
      <UpcyclingNextStepBand messages={nextStep} />
      <UpcyclingInterestBand
        eyebrow={interest.eyebrow}
        heading={interest.heading}
        body={interest.body}
      />
    </>
  )
}
