'use client'

import { Bell, Globe } from 'lucide-react'
import type { ProfileData } from '../hooks/useProfileData'

interface PreferencesSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function PreferencesSection({ profile, handleChange }: PreferencesSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Einstellungen
          </h2>
          <p className="text-sm text-gray-500">Sprache und Newsletter</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bevorzugte Sprache
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={profile.preferred_language}
              onChange={(e) => handleChange('preferred_language', e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="newsletter"
            type="checkbox"
            checked={profile.newsletter_subscribed}
            onChange={(e) => handleChange('newsletter_subscribed', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="newsletter" className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Newsletter abonnieren</span>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              Erhalten Sie Updates zu Workshops, Angeboten und Neuigkeiten von RevampIT
            </p>
          </label>
        </div>
      </div>
    </div>
  )
}
