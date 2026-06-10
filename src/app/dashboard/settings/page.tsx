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
    <main className="min-h-screen bg-canvas">
      <article className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center text-xs font-mono uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              {t('backToDashboard')}
            </Link>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {labels.pageDescription}
            </p>
            <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
              {labels.pageTitle}
            </Heading>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-md border border-subtle bg-surface-base px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('editProfile')}</span>
          </Link>
        </header>

        {/* Tabs — segmented control on neutral background */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface-raised p-1">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="ghost"
              size="sm"
              className={`flex-1 gap-2 ${
                activeTab === tab.id
                  ? 'bg-surface-base text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-3 rounded-lg border border-action/30 bg-action-muted/40 p-4">
              <CheckCircle2 className="h-5 w-5 text-action" />
              <p className="text-sm text-action">{labels.saveSuccess}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          <div className="rounded-lg border border-subtle bg-surface-base p-6">
            {activeTab === 'account' && (
              <AccountSection
                profile={profile}
                email={session?.user?.email || ''}
                handleChange={handleChange}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection profile={profile} handleChange={handleChange} />
            )}

            {activeTab === 'privacy' && (
              <PrivacySection profile={profile} handleChange={handleChange} />
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} variant="primary" className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {labels.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {labels.save}
                </>
              )}
            </Button>
          </div>
        </form>
      </article>
    </main>
  )
}
