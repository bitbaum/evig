'use client';

import { Link } from '@/i18n/navigation';
import { mainNavigation, socialLinks } from '@/config/navigation';
import { Logo } from '@/components/ui/Logo';
import { Mail } from 'lucide-react';
import { ORG, CONTACT } from '@/config/org';
import { ROUTES } from '@/config/routes';
import { EVIG_DIVISIONS } from '@/config/divisions';
import { NewsletterSignup } from '@/components/community/NewsletterSignup';
import Heading from '@/components/ui/Heading';
import { useTranslations } from 'next-intl';

// Every footer link is a 44px target (fleet nav contract rule 3) — the hit
// area grows, the text does not. The lists drop their space-y-2 to pay for it.
const FOOTER_LINK =
  'inline-flex min-h-touch min-w-touch items-center text-sm text-text-secondary hover:text-text-primary transition-colors';
const FOOTER_LEGAL_LINK =
  'inline-flex min-h-touch min-w-touch items-center justify-center hover:text-text-primary transition-colors';

/**
 * Footer — flips with theme like the rest of the site. The legacy
 * "always dark" treatment broke the visual rhythm of the page in
 * light mode. Surface uses neutral-50 / neutral-950 to match the
 * canvas, with border-only separators (no shadows, no gradients —
 * consistent with the design system rules).
 */
export default function Footer() {
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tDivisions = useTranslations('divisions');

  return (
    <footer className="bg-surface-raised text-text-primary border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Logo className="mb-4" showText={true} />
            <p className="text-sm text-text-secondary">{tFooter('mission')}</p>
          </div>

          {/* Navigation Section */}
          <nav aria-label={tFooter('navigation')}>
            <Heading
              level={3}
              className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4"
            >
              {tFooter('navigation')}
            </Heading>
            <ul>
              {mainNavigation.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className={FOOTER_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.nameKey ? tNav(item.nameKey as never) : item.name}
                    </a>
                  ) : (
                    <Link href={item.href} className={FOOTER_LINK}>
                      {item.nameKey ? tNav(item.nameKey as never) : item.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link href={ROUTES.public.vision} className={FOOTER_LINK}>
                  {tFooter('vision')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Divisions — the four evig lenses (SSOT: config/divisions.ts) */}
          <nav aria-label={tDivisions('overview.eyebrow')}>
            <Heading
              level={3}
              className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4"
            >
              {tDivisions('overview.eyebrow')}
            </Heading>
            <ul>
              {EVIG_DIVISIONS.map((division) => (
                <li key={division.id}>
                  <Link href={division.href} className={FOOTER_LINK}>
                    {division.wordmark}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Section */}
          <div>
            <Heading
              level={3}
              className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4"
            >
              {tNav('contact')}
            </Heading>
            <address className="space-y-4 not-italic">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                <a href={`mailto:${CONTACT.email}`} className={FOOTER_LINK}>
                  {CONTACT.email}
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t">
          <NewsletterSignup source="footer" />
        </div>

        {/* Social Links — only when evig actually has profiles (see socialLinks) */}
        {socialLinks.length > 0 && (
          <div className="mt-8 pt-6 border-t flex justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-md hover:bg-surface-raised dark:hover:bg-surface-base/4"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{social.name}</span>
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        {/* Legal Links — routes from ROUTES.public SSOT */}
        <div className="mt-6 pt-6 border-t">
          <nav
            aria-label={tFooter('legal')}
            className="flex flex-wrap justify-center gap-x-4 text-xs text-text-tertiary"
          >
            <Link href={ROUTES.public.impressum} className={FOOTER_LEGAL_LINK}>
              {tFooter('impressum')}
            </Link>
            <Link href={ROUTES.public.datenschutz} className={FOOTER_LEGAL_LINK}>
              {tFooter('privacyPolicy')}
            </Link>
            <Link href={ROUTES.public.agb} className={FOOTER_LEGAL_LINK}>
              {tFooter('termsOfService')}
            </Link>
            <Link href={ROUTES.public.transparenz} className={FOOTER_LEGAL_LINK}>
              {tFooter('transparency')}
            </Link>
            <Link href={ROUTES.public.changelog} className={FOOTER_LEGAL_LINK}>
              {tFooter('changelog')}
            </Link>
            <Link href={ROUTES.public.mitgliedWerden} className={FOOTER_LEGAL_LINK}>
              {tNav('membership')}
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-text-tertiary dark:text-text-tertiary">
          &copy; {new Date().getFullYear()} {ORG.name}. {tFooter('allRightsReserved')}
        </div>
      </div>
    </footer>
  );
}
