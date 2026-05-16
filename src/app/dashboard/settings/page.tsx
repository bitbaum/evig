'use client'

import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { useState } from 'react'
import { User, Bell, Shield, Save, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SETTINGS_CONFIG } from '@/config/profile'
import { useTranslations } from 'next-intl'

// Hooks (reuse from profile)
import { useProfileData } from '../profile/hooks/useProfileData'
import { useProfileForm } from '../profile/hooks/useProfileForm'

// Components
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { AccountSection } from './components/AccountSection'
import { NotificationsSection } from './components/NotificationsSection'
import { PrivacySection } from './components/PrivacySection'

type TabId = 'account' | 'notifications' | 'privacy'

export default function SettingsPage() {
  const { session, status, isLoading, profile, setProfile } = useProfileData()
  const { isSaving, saveSuccess, error, handleSubmit, handleChange } = useProfileForm({ profile, setProfile })

  const [activeTab, setActiveTab] = useState<TabId>('account')
  const t = useTranslations('dashboard.settings')

  const labels = SETTINGS_CONFIG.labels

  const tabs = [
    { id: 'account' as const, label: labels.tabs.account, icon: User },
    { id: 'notifications' as const, label: labels.tabs.notifications, icon: Bell },
    { id: 'privacy' as const, label: labels.tabs.privacy, icon: Shield },
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
            className="inline-flex items-center text-neutral-600 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
                {labels.pageTitle}
              </Heading>
              <p className="mt-1 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                {labels.pageDescription}
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('editProfile')}</span>
            </Link>
          </div>
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
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
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
            <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <p className="text-primary-700 dark:text-primary-300">
                {labels.saveSuccess}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border-2 border-error-200 dark:border-error-800 rounded-lg p-4">
              <p className="text-error-700 dark:text-error-300">{error}</p>
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
