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
    <main className="min-h-screen bg-canvas">
      <article className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header — flat, eyebrow + h1, settings link as ghost action */}
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
              {t('pageDescription')}
            </p>
            <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
              {t('pageTitle')}
            </Heading>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-md border border-subtle bg-surface-base px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('goToSettings')}</span>
          </Link>
        </header>

        {/* Account Status — single bordered list of two facts (divide-y),
            no nested mini-cards. */}
        <section aria-labelledby="profile-overview">
          <h2
            id="profile-overview"
            className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
          >
            <Shield className="mr-1.5 inline h-3 w-3 align-[-1px] text-action" />
            {t('accountOverview')}
          </h2>
          <dl className="mt-3 divide-y divide-subtle rounded-lg border border-subtle bg-surface-base">
            <div className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-action" />
              <div className="min-w-0">
                <dt className="text-sm font-medium text-text-primary">{t('emailVerified')}</dt>
                <dd className="truncate text-xs text-text-tertiary">{session?.user?.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <User className="h-4 w-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0">
                <dt className="text-sm font-medium text-text-primary">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.display_name || t('nameNotSet')}
                </dt>
                <dd className="text-xs text-text-tertiary">
                  {t('memberSince', { year: new Date().getFullYear() })}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {saveSuccess && (
            <div className="flex items-center gap-3 rounded-lg border border-action/30 bg-action-muted/40 p-4">
              <CheckCircle2 className="h-5 w-5 text-action" />
              <p className="text-sm text-action">{t('saveSuccess')}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          {/* Avatar */}
          <section aria-labelledby="profile-avatar">
            <h2
              id="profile-avatar"
              className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
            >
              {t('avatarSectionTitle')}
            </h2>
            <div className="mt-3 rounded-lg border border-subtle bg-surface-base p-6">
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                onUploadSuccess={handleAvatarUpload}
              />
            </div>
          </section>

          <PublicProfileSection profile={profile} handleChange={handleChange} />
          <PersonalInfoSection profile={profile} handleChange={handleChange} />
          {isServiceProvider && (
            <ServiceProviderSection profile={profile} handleChange={handleChange} />
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} variant="primary" className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t('save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </article>
    </main>
  )
}
