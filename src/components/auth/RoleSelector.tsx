'use client'

import { ROLES } from '@/lib/constants'
import { Package, Wrench, User } from 'lucide-react'

interface RoleSelectorProps {
  selectedRole: string
  onRoleChange: (role: string) => void
  disabled?: boolean
  variant?: 'default' | 'compact'
}

export function RoleSelector({ selectedRole, onRoleChange, disabled, variant = 'default' }: RoleSelectorProps) {
  const roles = [
    {
      id: ROLES.USER,
      title: 'Kunde',
      description: 'Kaufen Sie Produkte, buchen Sie Workshops und Reparaturen',
      icon: User,
      color: 'bg-blue-500',
      features: [
        'Produkte kaufen',
        'Workshops buchen',
        'Reparaturen beauftragen',
        'Rezensionen schreiben'
      ]
    },
    {
      id: ROLES.SELLER,
      title: 'Verkäufer',
      description: 'Verkaufen Sie Ihre eigenen refurbished Produkte im Marketplace',
      icon: Package,
      color: 'bg-green-500',
      features: [
        'Produkte verkaufen',
        'Marketplace-Zugang',
        'Verkaufsstatistiken',
        'Kundenkommunikation'
      ]
    },
    {
      id: ROLES.REPAIRER,
      title: 'Reparateur',
      description: 'Bieten Sie Reparaturdienste an und helfen Sie Geräte wiederherzustellen',
      icon: Wrench,
      color: 'bg-orange-500',
      features: [
        'Reparaturen anbieten',
        'Terminplanung',
        'Kundenbewertungen',
        'Einnahmen verfolgen'
      ]
    }
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
          Wählen Sie Ihre Rolle
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Optional. Sie können Ihre Rolle später jederzeit ändern.
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${variant === 'default' ? 'lg:grid-cols-3' : ''} gap-3 sm:gap-4`} role="radiogroup" aria-label="Rollenwahl">
        {roles.map((role) => (
          <div
            key={role.id}
            role="radio" aria-checked={selectedRole === role.id}
            className={`relative rounded-xl border p-3 sm:p-4 cursor-pointer transition-all break-words hyphens-auto ${
              selectedRole === role.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onRoleChange(role.id)}
          >
            <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${role.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <role.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white leading-tight">
                  {role.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-snug">
                  {role.description}
                </p>
              </div>
            </div>

            {variant === 'default' ? (
              <ul className="hidden md:block space-y-1">
                {role.features.map((feature, index) => (
                  <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role.features.slice(0, 2).join(' • ')}
              </p>
            )}

            {selectedRole === role.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRole && (
        <div className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg ${variant === 'default' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2.5 sm:ml-3">
              <h4 className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                Rolle: {roles.find(r => r.id === selectedRole)?.title}
              </h4>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                <p>
                  {selectedRole === ROLES.USER && "Perfekt für den Einstieg! Sie können später jederzeit zur Seller- oder Repairer-Rolle wechseln."}
                  {selectedRole === ROLES.SELLER && "Großartig! Sie können sofort mit dem Verkauf Ihrer refurbished Produkte beginnen."}
                  {selectedRole === ROLES.REPAIRER && "Ausgezeichnet! Ihre Reparaturkenntnisse werden der Community helfen."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
