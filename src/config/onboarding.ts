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
    title: 'Wirst du Reparatur-Experte bei Revamp-IT',
    subtitle: 'Biete deine Reparaturdienste an und verbinde dich mit Kunden, die deine Fachkenntnisse brauchen.'
  },
  benefits: [
    {
      icon: Users,
      iconColor: 'text-primary-600',
      title: 'Direkt mit Kunden verbinden',
      description: 'Erhalte direkte Anfragen von Kunden in deinem Einzugsgebiet. Keine Zwischenhändler, volle Kontrolle über deine Dienstleistungen.'
    },
    {
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      title: 'Erhöhe deine Sichtbarkeit',
      description: 'Zeige dein Fachwissen, Bewertungen und Zertifizierungen. Baue Vertrauen mit einem professionellen Profil auf.'
    },
    {
      icon: Star,
      iconColor: 'text-yellow-600',
      title: 'Bewertungssystem',
      description: 'Sammle Bewertungen und baue eine Reputation auf. Hervorragende Bewertungen helfen dir, mehr Kunden zu gewinnen.'
    },
    {
      icon: Clock,
      iconColor: 'text-purple-600',
      title: 'Flexible Arbeitszeiten',
      description: 'Lege deine eigenen Verfügbarkeiten fest. Arbeite wann und wo du möchtest, solange es zu deinen Kunden passt.'
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
      iconColor: 'text-primary-600',
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
    href: '/profil/techniker',
    label: 'Als Techniker bewerben',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    loginText: 'Bereits Techniker?',
    loginHref: '/auth/login',
    linkColor: 'text-blue-600 hover:text-blue-700'
  },
  faq: {
    title: 'Häufige Fragen',
    items: [
      {
        question: 'Wie funktioniert die Bezahlung?',
        answer: 'Kunden bezahlen direkt über die Plattform. Du erhältst dein Geld abzüglich der Servicegebühr innerhalb von 3-5 Werktagen nach erfolgreichem Abschluss der Reparatur.'
      },
      {
        question: 'Was passiert bei Streitigkeiten?',
        answer: 'Unser Team vermittelt bei Meinungsverschiedenheiten. Wir prüfen alle Fälle individuell und stellen sicher, dass beide Parteien fair behandelt werden.'
      },
      {
        question: 'Kann ich meine Preise selbst festlegen?',
        answer: 'Ja, du legst deine Stundensätze und Servicepreise selbst fest. Wir empfehlen wettbewerbsfähige Preise basierend auf Marktstandards in deiner Region.'
      }
    ]
  },
  roleCheck: {
    redirectRoles: ['repairer'],
    redirectTo: '/profil/techniker'
  }
}
