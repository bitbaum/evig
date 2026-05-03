'use client'

import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { User, Save, Loader2, CheckCircle2, ArrowLeft, Shield, Settings as SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

// Hooks
import { useProfileData } from './hooks/useProfileData'
import { useProfileForm } from './hooks/useProfileForm'

// Components
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { PersonalInfoSection } from './components/PersonalInfoSection'
import { PublicProfileSection } from './components/PublicProfileSection'
import { ServiceProviderSection } from './components/ServiceProviderSection'

export default function ProfilePage() {
  const t = useTranslations('dashboard.profile')
  const { session, status, isLoading, profile, setProfile, isServiceProvider } = useProfileData()
  const { isSaving, saveSuccess, error, handleSubmit, handleChange } = useProfileForm({ profile, setProfile })

  const handleAvatarUpload = (url: string) => {
    handleChange('avatar_url', url)
  }

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
            {t('backToDashboard')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
                {t('pageTitle')}
              </Heading>
              <p className="mt-1 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                {t('pageDescription')}
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('goToSettings')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Status */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
                {t('accountOverview')}
              </Heading>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('accountOverviewDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verified */}
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {t('emailVerified')}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.display_name || t('nameNotSet')}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('memberSince', { year: new Date().getFullYear() })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <p className="text-primary-700 dark:text-primary-300">
                {t('saveSuccess')}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border-2 border-error-200 dark:border-error-800 rounded-lg p-4">
              <p className="text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          {/* Avatar Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-6">
            <Heading level={2} className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
              {t('avatarSectionTitle')}
            </Heading>
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              onUploadSuccess={handleAvatarUpload}
            />
          </div>

          {/* Public Profile Section */}
          <PublicProfileSection profile={profile} handleChange={handleChange} />

          {/* Personal Info Section */}
          <PersonalInfoSection profile={profile} handleChange={handleChange} />

          {/* Service Provider Section (conditional) */}
          {isServiceProvider && (
            <ServiceProviderSection profile={profile} handleChange={handleChange} />
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSaving} variant="primary" className="gap-2 px-6 py-3">
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
