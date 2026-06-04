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
    <main className="min-h-screen bg-surface-raised">
      {/* Header */}
      <div className="bg-surface-base border-b-2 border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-text-secondary hover:text-text-secondary dark:text-text-muted mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-text-primary">
                {labels.pageTitle}
              </Heading>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">
                {labels.pageDescription}
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised hover:bg-surface-overlay text-text-secondary rounded-lg transition-colors text-sm"
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
        <div className="bg-surface-base rounded-xl shadow-xs border-2 border mb-6 overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-action text-action bg-action-muted/50'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised'
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
            <div className="bg-action-muted-muted border-2 border-strong rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-action" />
              <p className="text-action">
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
          <div className="bg-surface-base rounded-xl shadow-xs border-2 border p-6">
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
