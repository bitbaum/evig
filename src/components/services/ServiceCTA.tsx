/**
 * ServiceCTA Component
 *
 * Reusable call-to-action section for service pages.
 * Maintains consistent branding and CTAs.
 */

import Link from 'next/link';
import AppointmentBookingForm from './AppointmentBookingForm';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Section } from '@/components/layout/Section';

interface ServiceCTAProps {
  serviceTitle: string;
  serviceSlug?: string;
  pricing?: string;
}

export default function ServiceCTA({ serviceTitle, serviceSlug, pricing }: ServiceCTAProps) {
  return (
    <Section density="default" tone="surface" contained={false} className="border-t border-subtle">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Eyebrow as="div">Termin</Eyebrow>
        <h2 className="mt-3 text-2xl font-semibold text-text-primary sm:text-3xl">
          Bereit loszulegen?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Buchen Sie jetzt Ihren Termin für unsere {serviceTitle} Dienstleistungen.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {serviceSlug && (
            <AppointmentBookingForm
              serviceSlug={serviceSlug}
              serviceTitle={serviceTitle}
              pricing={pricing}
            />
          )}
          <Link href="/contact" className="ui-public-cta-ghost">
            Kontakt
          </Link>
          <Link
            href="/services"
            className="text-sm text-text-secondary transition-colors hover:text-action"
          >
            Zurück zu Services
          </Link>
        </div>
      </div>
    </Section>
  );
}
