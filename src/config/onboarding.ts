/**
 * Onboarding Configuration - Single Source of Truth
 *
 * Centralizes onboarding page content for repairers.
 * Used by OnboardingInfoPage component.
 */

import { LucideIcon, Shield, Wrench, Users, TrendingUp, Star, Clock, Award, CheckCircle } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface BenefitItem {
  icon: LucideIcon
  iconColor: string
  title: string
  description: string
}

export interface RequirementItem {
  title: string
  description: string
}

export interface PricingItem {
  label: string
  value: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface TrustBadge {
  icon: LucideIcon
  iconColor: string
  title: string
  subtitle: string
}

export interface OnboardingConfig {
  /** Page metadata */
  meta: {
    title: string
    description: string
  }
  /** Header section */
  header: {
    icon: LucideIcon
    iconBgColor: string
    iconColor: string
    title: string
    subtitle: string
  }
  /** Benefits grid (2x2) */
  benefits: BenefitItem[]
  /** Requirements section */
  requirements: {
    title: string
    items: RequirementItem[]
  }
  /** Pricing info box */
  pricing: {
    icon: LucideIcon
    iconColor: string
    title: string
    items: PricingItem[]
  }
  /** Trust badges (optional, used by repairer) */
  trustBadges?: TrustBadge[]
  /** CTA section */
  cta: {
    href: string
    label: string
    buttonColor: string
    loginText: string
    loginHref: string
    linkColor: string
  }
  /** FAQ section */
  faq: {
    title: string
    items: FAQItem[]
  }
  /** Role check configuration */
  roleCheck: {
    /** Roles that should redirect away (user already has this role) */
    redirectRoles: string[]
    /** Where to redirect if user already has role */
    redirectTo: string
  }
}

// ============================================================================
// SELLER ONBOARDING CONFIG
// ============================================================================

// ============================================================================
// REPAIRER ONBOARDING CONFIG
// ============================================================================

export const REPAIRER_ONBOARDING: OnboardingConfig = {
  meta: {
    title: 'Repairer Onboarding | Revamp-IT',
    description: 'Become a certified repair person on the Revamp-IT platform and connect with customers in need of repair services.'
  },
  header: {
    icon: Wrench,
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Werden Sie Reparatur-Experte bei Revamp-IT',
    subtitle: 'Bieten Sie Ihre Reparaturdienste an und verbinden Sie sich mit Kunden, die Ihre Fachkenntnisse brauchen.'
  },
  benefits: [
    {
      icon: Users,
      iconColor: 'text-green-600',
      title: 'Direkt mit Kunden verbinden',
      description: 'Erhalten Sie direkte Anfragen von Kunden in Ihrem Einzugsgebiet. Keine Zwischenhändler, volle Kontrolle über Ihre Dienstleistungen.'
    },
    {
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      title: 'Erhöhen Sie Ihre Sichtbarkeit',
      description: 'Zeigen Sie Ihr Fachwissen, Bewertungen und Zertifizierungen. Bauen Sie Vertrauen mit einem professionellen Profil auf.'
    },
    {
      icon: Star,
      iconColor: 'text-yellow-600',
      title: 'Bewertungssystem',
      description: 'Sammeln Sie Bewertungen und bauen Sie eine Reputation auf. Hervorragende Bewertungen helfen Ihnen, mehr Kunden zu gewinnen.'
    },
    {
      icon: Clock,
      iconColor: 'text-purple-600',
      title: 'Flexible Arbeitszeiten',
      description: 'Legen Sie Ihre eigenen Verfügbarkeiten fest. Arbeiten Sie wann und wo Sie möchten, solange es zu Ihren Kunden passt.'
    }
  ],
  requirements: {
    title: 'Anforderungen',
    items: [
      {
        title: 'Fachkenntnisse nachweisen',
        description: 'Mindestens 2 Jahre Erfahrung in der Reparatur von Elektronikgeräten'
      },
      {
        title: 'Verifizierung',
        description: 'Ausweis, Zertifizierungen und Referenzen werden überprüft'
      },
      {
        title: 'Versicherung',
        description: 'Berufshaftpflichtversicherung für Reparaturdienste'
      },
      {
        title: 'Qualitätssicherung',
        description: 'Einhaltung unserer Qualitätsstandards und Garantiebedingungen'
      }
    ]
  },
  pricing: {
    icon: Award,
    iconColor: 'text-blue-600',
    title: 'Faire Gebühren',
    items: [
      { label: 'Keine', value: 'monatlichen Mitgliedsgebühren' },
      { label: '5%', value: 'Serviceprovision auf jede erfolgreiche Buchung' },
      { label: 'Kostenlose', value: 'Verifizierung und Profilerstellung' },
      { label: 'Premium', value: 'Sichtbarkeit für verifizierte Experten' }
    ]
  },
  trustBadges: [
    {
      icon: Shield,
      iconColor: 'text-green-600',
      title: 'Verifiziert',
      subtitle: 'Qualitätsgeprüft'
    },
    {
      icon: Star,
      iconColor: 'text-yellow-600',
      title: 'Bewertet',
      subtitle: 'Kundenfeedback'
    },
    {
      icon: CheckCircle,
      iconColor: 'text-blue-600',
      title: 'Versichert',
      subtitle: 'Haftpflicht'
    }
  ],
  cta: {
    href: '/dashboard/repairer/onboarding/apply',
    label: 'Als Reparateur bewerben',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    loginText: 'Bereits Reparateur?',
    loginHref: '/auth/login',
    linkColor: 'text-blue-600 hover:text-blue-700'
  },
  faq: {
    title: 'Häufige Fragen',
    items: [
      {
        question: 'Wie funktioniert die Bezahlung?',
        answer: 'Kunden bezahlen direkt über die Plattform. Sie erhalten Ihr Geld abzüglich der Servicegebühr innerhalb von 3-5 Werktagen nach erfolgreichem Abschluss der Reparatur.'
      },
      {
        question: 'Was passiert bei Streitigkeiten?',
        answer: 'Unser Team vermittelt bei Meinungsverschiedenheiten. Wir prüfen alle Fälle individuell und stellen sicher, dass beide Parteien fair behandelt werden.'
      },
      {
        question: 'Kann ich meine Preise selbst festlegen?',
        answer: 'Ja, Sie legen Ihre Stundensätze und Servicepreise selbst fest. Wir empfehlen wettbewerbsfähige Preise basierend auf Marktstandards in Ihrer Region.'
      }
    ]
  },
  roleCheck: {
    redirectRoles: ['repairer'],
    redirectTo: '/dashboard/repairer'
  }
}
