'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Crown,
  Shield,
  Users,
  Wrench,
  UserCheck,
  Star,
  CheckCircle,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react'
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '@/lib/constants'

interface RoleWelcomeProps {
  userRole: string
  userEmail: string
  onClose: () => void
}

export function RoleWelcome({ userRole, userEmail, onClose }: RoleWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const isRevampitUser = userEmail.endsWith('@revamp-it.ch')

  const getRoleInfo = (role: string) => {
    switch (role) {
      case ROLES.REVAMPIT_SUPER_ADMIN:
      case ROLES.REVAMPIT_ADMIN:
        return {
          icon: Crown,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          title: 'Willkommen im Admin-Bereich!',
          description: 'Als RevampIT-Teammitglied haben Sie vollen Zugriff auf das System.',
          features: [
            'Vollständige Systemverwaltung',
            'Benutzer- und Rollenverwaltung',
            'Produkt- und Bestellungsverwaltung',
            'Finanzberichte und Analytics',
            'Systemkonfiguration'
          ],
          nextSteps: [
            { label: 'Admin-Dashboard erkunden', href: '/admin' },
            { label: 'Benutzer verwalten', href: '/admin/users' },
            { label: 'Produkte hinzufügen', href: '/admin/products/new' }
          ]
        }

      case ROLES.REVAMPIT_EDITOR:
        return {
          icon: Shield,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          title: 'Willkommen im Content-Bereich!',
          description: 'Als Content-Editor verwalten Sie Inhalte und Kommunikation.',
          features: [
            'Blog-Artikel und Seiten verwalten',
            'Workshops erstellen und bearbeiten',
            'Newsletter und Mitteilungen',
            'SEO-Optimierung',
            'Community-Moderation'
          ],
          nextSteps: [
            { label: 'Workshops verwalten', href: '/admin/workshops' },
            { label: 'Blog-Artikel schreiben', href: '/ai-cms' },
            { label: 'Newsletter erstellen', href: '/admin/newsletter' }
          ]
        }

      case ROLES.SELLER:
        return {
          icon: Users,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          title: 'Willkommen im Marketplace!',
          description: 'Als Seller können Sie Ihre refurbished Produkte verkaufen.',
          features: [
            'Produkte zum Marketplace hinzufügen',
            'Verkäufe und Bestellungen verwalten',
            'Kundenkommunikation',
            'Bewertungen und Feedback',
            'Verkaufsstatistiken'
          ],
          nextSteps: [
            { label: 'Produkt hinzufügen', href: '/dashboard/seller/products/new' },
            { label: 'Verkäufe anzeigen', href: '/dashboard/seller/sales' },
            { label: 'KI-Produkterfassung', href: '/inventory/ai-capture' }
          ]
        }

      case ROLES.REPAIRER:
        return {
          icon: Wrench,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          title: 'Willkommen bei den Service-Providern!',
          description: 'Als Service-Provider bieten Sie Reparatur- und Wartungsdienste an.',
          features: [
            'Service-Angebote verwalten',
            'Terminplanung und -verwaltung',
            'Kundenkommunikation',
            'Service-Bewertungen',
            'Einnahmenverfolgung'
          ],
          nextSteps: [
            { label: 'Service anbieten', href: '/admin/services/new' },
            { label: 'Termine verwalten', href: '/admin/services' },
            { label: 'Kundenfeedback', href: '/dashboard/repairer/reviews' }
          ]
        }

      default:
        return {
          icon: UserCheck,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          title: 'Willkommen bei RevampIT!',
          description: 'Als Kunde haben Sie Zugriff auf unsere nachhaltigen Produkte und Dienstleistungen.',
          features: [
            'Refurbished Produkte kaufen',
            'Workshops und Kurse buchen',
            'Reparaturdienste in Anspruch nehmen',
            'Nachhaltige Technologie kennenlernen',
            'Community beitreten'
          ],
          nextSteps: [
            { label: 'Shop erkunden', href: '/shop' },
            { label: 'Workshops ansehen', href: '/workshops' },
            { label: 'Als Seller anmelden', href: '/dashboard/seller' }
          ]
        }
    }
  }

  const roleInfo = getRoleInfo(userRole)
  const RoleIcon = roleInfo.icon

  const steps = [
    {
      title: 'Willkommen!',
      content: (
        <div className="text-center">
          <div className={`w-16 h-16 ${roleInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <RoleIcon className={`w-8 h-8 ${roleInfo.color}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {roleInfo.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {roleInfo.description}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Rolle: {ROLE_DISPLAY_NAMES[userRole as keyof typeof ROLE_DISPLAY_NAMES] || userRole}
          </div>
        </div>
      )
    },
    {
      title: 'Ihre Berechtigungen',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Was Sie tun können:
          </h3>
          <div className="space-y-3">
            {roleInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Nächste Schritte',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            So geht's weiter:
          </h3>
          <div className="space-y-3">
            {roleInfo.nextSteps.map((step, index) => (
              <Link
                key={index}
                href={step.href}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                onClick={onClose}
              >
                <span className="text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                  {step.label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </Link>
            ))}
          </div>

          {isRevampitUser && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">
                    Team-Infos
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Als @revamp-it.ch Benutzer haben Sie automatisch Admin-Zugriff.
                    Nutzen Sie die Admin-Oberfläche für Systemverwaltung und Content-Management.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${roleInfo.bgColor} rounded-lg flex items-center justify-center`}>
              <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {steps[currentStep].title}
              </h1>
              <div className="flex gap-1 mt-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= currentStep ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentStep + 1} von {steps.length}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Weiter
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Loslegen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}



