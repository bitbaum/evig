import { getTranslations } from 'next-intl/server'
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

export default async function UpcyclingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('projects')
  const nav = t.raw('upcycling.nav') as SubNavMessages

  // Nav order matches reading depth: visual / exploratory pages first,
  // then evidence pages (wirkung → businessplan → status snapshot).
  const items = [
    { href: '/projects/upcycling',                label: nav.overview },
    { href: '/projects/upcycling/applications',   label: nav.applications },
    { href: '/projects/upcycling/gallery',        label: nav.gallery },
    { href: '/projects/upcycling/build-your-own', label: nav.buildYourOwn },
    { href: '/projects/upcycling/wirkung',        label: nav.wirkung },
    { href: '/projects/upcycling/businessplan',   label: nav.businessPlan },
    { href: '/projects/upcycling/status',         label: nav.status },
  ]

  return (
    <>
      <UpcyclingSubNav items={items} brand={nav.brand} />
      {children}
    </>
  )
}
