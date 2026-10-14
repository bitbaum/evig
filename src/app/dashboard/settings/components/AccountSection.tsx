'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/ui/Heading';
import { Input } from '@/components/ui/input';
import { SETTINGS_CONFIG } from '@/config/profile';
import { CONTACT } from '@/config/org';
import { useTranslations } from 'next-intl';
import type { ProfileData } from '../../profile/hooks/useProfileData';
import { AccountAccess } from './AccountAccess';

interface AccountSectionProps {
  profile: ProfileData;
  email: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  handleChange: (field: keyof ProfileData, value: string) => void;
}

export function AccountSection({
  profile,
  email,
  isSuperAdmin,
  emailVerified,
  handleChange,
}: AccountSectionProps) {
  const labels = SETTINGS_CONFIG.labels.account;
  const t = useTranslations('dashboard.settings.account');

  return (
    <div className="space-y-8">
      {/* Name Fields */}
      <div>
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">
          {labels.title}
        </Heading>
        <p className="text-sm text-text-secondary mb-6">{labels.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              {labels.firstName}
            </label>
            <Input
              type="text"
              id="first_name"
              value={profile.first_name || ''}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder={labels.firstNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              {labels.lastName}
            </label>
            <Input
              type="text"
              id="last_name"
              value={profile.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder={labels.lastNamePlaceholder}
            />
          </div>
        </div>
      </div>

      <AccountAccess email={email} isSuperAdmin={isSuperAdmin} emailVerified={emailVerified} />

      {/* Danger Zone */}
      <div className="border-t-2 border-error-200 dark:border-error-900 pt-6">
        <Heading
          level={4}
          className="text-base font-semibold text-error-600 dark:text-error-400 mb-2"
        >
          {labels.deleteAccount}
        </Heading>
        <p className="text-sm text-text-secondary mb-4">{labels.deleteAccountWarning}</p>
        {/* Account deletion is handled manually by staff (no self-serve cascade
            delete yet). The button opens a pre-filled deletion request to
            support so it performs a real action instead of being inert. */}
        <Button
          as="a"
          href={`mailto:${CONTACT.supportEmail}?subject=${encodeURIComponent(labels.deleteAccount)}&body=${encodeURIComponent(t('deleteRequestBody', { email }))}`}
          variant="destructive-outline"
        >
          <Trash2 className="w-4 h-4" />
          {labels.deleteAccountButton}
        </Button>
      </div>
    </div>
  );
}
