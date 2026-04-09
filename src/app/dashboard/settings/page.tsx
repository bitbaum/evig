'use client'

import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { useState } from 'react'
import { User, Bell, Shield, FileText, Save, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SETTINGS_CONFIG } from '@/config/profile'

// Hooks (reuse from profile)
import { useProfileData } from '../profile/hooks/useProfileData'
import { useProfileForm } from '../profile/hooks/useProfileForm'
import { usePostalCodeLookup } from '../profile/hooks/usePostalCodeLookup'

// Components
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { AccountSection } from './components/AccountSection'
import { NotificationsSection } from './components/NotificationsSection'
import { PrivacySection } from './components/PrivacySection'
import { PersonalInfoSection } from './components/PersonalInfoSection'

type TabId = 'account' | 'notifications' | 'privacy' | 'personalInfo'

export default function SettingsPage() {
  const { session, status, isLoading, profile, setProfile } = useProfileData()
  const { isSaving, saveSuccess, error, handleSubmit, handleChange } = useProfileForm({ profile, setProfile })
  const {
    postalCodeSuggestions,
    showSuggestions,
    handlePostalCodeChange,
    handleCitySearch,
    selectPostalSuggestion,
  } = usePostalCodeLookup({ setProfile })

  const [activeTab, setActiveTab] = useState<TabId>('account')

  const labels = SETTINGS_CONFIG.labels

  const tabs = [
    { id: 'account' as const, label: labels.tabs.account, icon: User },
    { id: 'notifications' as const, label: labels.tabs.notifications, icon: Bell },
    { id: 'privacy' as const, label: labels.tabs.privacy, icon: Shield },
    { id: 'personalInfo' as const, label: labels.tabs.personalInfo, icon: FileText },
  ]

  if (status === 'loading' || isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
            {labels.pageTitle}
          </Heading>
          <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-neutral-400">
            {labels.pageDescription}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 mb-6 overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">
                {labels.saveSuccess}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-6">
            {activeTab === 'account' && (
              <AccountSection
                profile={profile}
                email={session?.user?.email || ''}
                handleChange={handleChange}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection
                profile={profile}
                handleChange={handleChange}
              />
            )}

            {activeTab === 'privacy' && (
              <PrivacySection
                profile={profile}
                handleChange={handleChange}
              />
            )}

            {activeTab === 'personalInfo' && (
              <PersonalInfoSection
                profile={profile}
                handleChange={handleChange}
                handlePostalCodeChange={handlePostalCodeChange}
                handleCitySearch={handleCitySearch}
                postalCodeSuggestions={postalCodeSuggestions}
                showSuggestions={showSuggestions}
                selectPostalSuggestion={selectPostalSuggestion}
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} variant="primary" className="gap-2 px-6 py-3">
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {labels.saving}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {labels.save}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
