'use client'

import React from 'react'
import { ArrowRight, ArrowLeft, MapPin, Briefcase, Tag, Wrench, Package } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getButtonVariant } from '@/lib/design-system'

interface ProfileData {
  location?: string
  interests?: string[]
  businessName?: string
  services?: string[]
  categories?: string[]
}

interface ProfileStepProps {
  role: string
  profileData: ProfileData
  onProfileChange: (data: ProfileData) => void
  onNext: () => void
  onSkip: () => void
  isLoading?: boolean
}

const CUSTOMER_INTERESTS = [
  'Laptop-Reparaturen',
  'Smartphone-Reparaturen',
  'PC-Zusammenbau',
  'Linux & Open Source',
  'Workshops',
  'Refurbished Geräte'
]

const REPAIRER_SERVICES = [
  'Laptop-Reparatur',
  'Smartphone-Reparatur',
  'PC-Reparatur',
  'Tablet-Reparatur',
  'Datenrettung',
  'Software-Installation'
]

const SELLER_CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Desktop-PCs',
  'Monitore',
  'Zubehör'
]

export function ProfileStep({
  role,
  profileData,
  onProfileChange,
  onNext,
  onSkip,
  isLoading = false
}: ProfileStepProps) {
  const toggleItem = (field: 'interests' | 'services' | 'categories', item: string) => {
    const current = profileData[field] || []
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    onProfileChange({ ...profileData, [field]: updated })
  }

  const renderCustomerForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Standort (PLZ oder Stadt)
        </label>
        <input
          type="text"
          value={profileData.location || ''}
          onChange={(e) => onProfileChange({ ...profileData, location: e.target.value })}
          placeholder="z.B. 8001 oder Zürich"
          className="w-full px-4 py-3 border-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Tag className="w-4 h-4 inline mr-2" />
          Interessen (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleItem('interests', interest)}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                (profileData.interests || []).includes(interest)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderRepairerForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="w-4 h-4 inline mr-2" />
          Geschäftsname
        </label>
        <input
          type="text"
          value={profileData.businessName || ''}
          onChange={(e) => onProfileChange({ ...profileData, businessName: e.target.value })}
          placeholder="z.B. Meier IT-Reparaturen"
          className="w-full px-4 py-3 border-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Standort
        </label>
        <input
          type="text"
          value={profileData.location || ''}
          onChange={(e) => onProfileChange({ ...profileData, location: e.target.value })}
          placeholder="z.B. 8001 Zürich"
          className="w-full px-4 py-3 border-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Wrench className="w-4 h-4 inline mr-2" />
          Angebotene Dienste
        </label>
        <div className="flex flex-wrap gap-2">
          {REPAIRER_SERVICES.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggleItem('services', service)}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                (profileData.services || []).includes(service)
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {service}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSellerForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="w-4 h-4 inline mr-2" />
          Shop-Name
        </label>
        <input
          type="text"
          value={profileData.businessName || ''}
          onChange={(e) => onProfileChange({ ...profileData, businessName: e.target.value })}
          placeholder="z.B. GreenTech Refurbished"
          className="w-full px-4 py-3 border-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Package className="w-4 h-4 inline mr-2" />
          Produktkategorien
        </label>
        <div className="flex flex-wrap gap-2">
          {SELLER_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleItem('categories', category)}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                (profileData.categories || []).includes(category)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const roleConfig: Record<string, { title: string; description: string; form: () => React.JSX.Element }> = {
    [ROLES.CUSTOMER]: {
      title: 'Vervollständigen Sie Ihr Profil',
      description: 'Helfen Sie uns, passende Angebote für Sie zu finden',
      form: renderCustomerForm
    },
    [ROLES.REPAIRER]: {
      title: 'Reparateur-Profil',
      description: 'Erzählen Sie uns von Ihren Reparaturdiensten',
      form: renderRepairerForm
    },
    [ROLES.SELLER]: {
      title: 'Verkäufer-Profil',
      description: 'Richten Sie Ihren Shop ein',
      form: renderSellerForm
    }
  }

  const config = roleConfig[role] || roleConfig[ROLES.CUSTOMER]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
      </div>

      {config.form()}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span>Überspringen</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors',
            getButtonVariant('primary').bg,
            getButtonVariant('primary').text,
            getButtonVariant('primary').hover
          )}
        >
          <span>Fertig</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
