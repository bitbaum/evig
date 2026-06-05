'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  ArrowRight,
  Wrench,
  ShoppingBag,
  Search,
  HandHeart,
  type LucideIcon,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'

interface RegistrationCompletionScreenProps {
  emailVerified: boolean
}

interface NextActionCard {
  href: string
  icon: LucideIcon
  titleKey: 'donateHardware' | 'findHelp' | 'offerHelp' | 'browseShop'
  descKey: 'donateHardwareDesc' | 'findHelpDesc' | 'offerHelpDesc' | 'browseShopDesc'
  /** Visual weight: 'featured' = mission-critical (donate); 'standard' = the rest. */
  weight: 'featured' | 'standard'
}

/**
 * Completion screen for the registration wizard.
 *
 * Surfaces 4 next-action paths the new user can take. The "Spende ein
 * Gerät" card is featured (mission inflow per RevampIT vision: "used
 * computers get repaired and rehomed"); without donations there is
 * nothing to rehome. The other 3 are quick paths into the platform.
 *
 * Split out from RegistrationWizard (UU.1 god-component cleanup) so the
 * orchestrator stays focused on flow state.
 */
export function RegistrationCompletionScreen({ emailVerified }: RegistrationCompletionScreenProps) {
  const t = useTranslations('auth.register')

  const cards: NextActionCard[] = [
    {
      href: ROUTES.public.donate,
      icon: HandHeart,
      titleKey: 'donateHardware',
      descKey: 'donateHardwareDesc',
      weight: 'featured',
    },
    {
      href: ROUTES.public.itHilfe,
      icon: Search,
      titleKey: 'findHelp',
      descKey: 'findHelpDesc',
      weight: 'standard',
    },
    {
      href: ROUTES.public.profilTechniker,
      icon: Wrench,
      titleKey: 'offerHelp',
      descKey: 'offerHelpDesc',
      weight: 'standard',
    },
    {
      href: ROUTES.public.shop,
      icon: ShoppingBag,
      titleKey: 'browseShop',
      descKey: 'browseShopDesc',
      weight: 'standard',
    },
  ]

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card-shell rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-action" />
          </div>
          <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
            {t('welcomeHeading', { orgName: ORG.name })}
          </Heading>
          <p className="text-text-secondary dark:text-text-muted">
            {emailVerified ? t('accountReady') : t('accountCreatedVerifyPending')}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary mb-3">{t('nextStepsTitle')}</p>

          {cards.map((card) => {
            const Icon = card.icon
            const featured = card.weight === 'featured'
            return (
              <Link
                key={card.href}
                href={card.href}
                className={
                  featured
                    ? 'flex items-center gap-3 p-4 rounded-lg border-2 border-action bg-action-muted hover:bg-action-muted transition-colors'
                    : 'flex items-center gap-3 p-4 rounded-lg border border-strong hover:bg-surface-raised transition-colors'
                }
              >
                <div
                  className={
                    featured
                      ? 'w-10 h-10 bg-surface-base rounded-full flex items-center justify-center'
                      : 'w-10 h-10 bg-action-muted rounded-full flex items-center justify-center'
                  }
                >
                  <Icon className="w-5 h-5 text-action" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    {t(card.titleKey)}
                    {featured && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-action">
                        {t('featuredBadge')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-text-tertiary dark:text-text-muted">
                    {t(card.descKey)}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-tertiary" />
              </Link>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-strong">
          <Button as={Link} href={ROUTES.public.login} variant="primary" className="w-full">
            {t('signInNow')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
