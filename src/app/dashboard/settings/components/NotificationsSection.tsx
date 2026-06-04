'use client'

import { Mail, Smartphone, ShoppingBag, Calendar } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { SETTINGS_CONFIG } from '@/config/profile'
import type { ProfileData } from '../../profile/hooks/useProfileData'

interface NotificationsSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: boolean) => void
}

export function NotificationsSection({ profile, handleChange }: NotificationsSectionProps) {
  const labels = SETTINGS_CONFIG.labels.notifications

  const notificationOptions = [
    {
      id: 'email_notifications' as keyof ProfileData,
      icon: Mail,
      label: labels.emailNotifications,
      description: labels.emailNotificationsDescription,
      value: profile.email_notifications ?? true,
    },
    {
      id: 'sms_notifications' as keyof ProfileData,
      icon: Smartphone,
      label: labels.smsNotifications,
      description: labels.smsNotificationsDescription,
      value: profile.sms_notifications ?? false,
    },
    {
      id: 'marketplace_updates' as keyof ProfileData,
      icon: ShoppingBag,
      label: labels.marketplaceUpdates,
      description: labels.marketplaceUpdatesDescription,
      value: profile.marketplace_updates ?? true,
    },
    {
      id: 'workshop_reminders' as keyof ProfileData,
      icon: Calendar,
      label: labels.workshopReminders,
      description: labels.workshopRemindersDescription,
      value: profile.workshop_reminders ?? true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-2">
          {labels.title}
        </Heading>
        <p className="text-sm text-text-secondary mb-6">
          {labels.description}
        </p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-start gap-4 p-4 bg-surface-raised dark:bg-neutral-700/50 rounded-lg border-2 border dark:border-neutral-600"
          >
            <div className="shrink-0">
              <div className="w-10 h-10 bg-surface-raised dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                <option.icon className="w-5 h-5 text-text-secondary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <Heading level={4} className="text-sm font-medium text-text-primary">
                  {option.label}
                </Heading>
                <button
                  type="button"
                  onClick={() => handleChange(option.id, !option.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    option.value ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-base shadow ring-0 transition duration-200 ease-in-out ${
                      option.value ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
