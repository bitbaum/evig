'use client';

import { useTranslations } from 'next-intl';
import {
  BadgeCheck,
  MapPin,
  Calendar,
  ShoppingBag,
  Wrench,
  GraduationCap,
  FileText,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { formatDateShort } from '@/lib/date-formats';
import { Avatar } from '@/components/ui/Avatar';
import { Eyebrow } from '@/components/ui/Eyebrow';
import Heading from '@/components/ui/Heading';
import type { PublicProfile as PublicProfileData } from '@/lib/services/profile-service';

/**
 * Profile header: identity (avatar, name, verification, role badges), location
 * and member-since meta, bio, and the stat tiles (glance line on phones, tile
 * grid from sm up). Stat tiles are derived here — only meaningful ones show.
 */
export function ProfileHeader({ profile }: { profile: PublicProfileData }) {
  const t = useTranslations('profile');
  const location = [profile.city, profile.canton].filter(Boolean).join(', ');

  // Stat tiles — only the meaningful ones for this person.
  const stats: Array<{ label: string; value: string; icon: typeof ShoppingBag }> = [];
  if (profile.stats.listings > 0)
    stats.push({
      label: t('statListings'),
      value: String(profile.stats.listings),
      icon: ShoppingBag,
    });
  if (profile.stats.services > 0)
    stats.push({ label: t('statServices'), value: String(profile.stats.services), icon: Wrench });
  if (profile.stats.workshops > 0)
    stats.push({
      label: t('statWorkshops'),
      value: String(profile.stats.workshops),
      icon: GraduationCap,
    });
  if (profile.stats.posts > 0)
    stats.push({ label: t('statPosts'), value: String(profile.stats.posts), icon: FileText });
  if (profile.stats.rating != null && profile.stats.rating > 0)
    stats.push({ label: t('statRating'), value: profile.stats.rating.toFixed(1), icon: Star });

  return (
    <div className="mb-8 border-b border-subtle pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar
          src={profile.avatar_url}
          name={profile.name}
          size="xl"
          shape="rounded"
          bordered
          className="sm:h-24 sm:w-24"
        />
        <div className="min-w-0 flex-1">
          <Eyebrow as="div">{t('publicProfile')}</Eyebrow>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Heading level={1} className="text-3xl font-semibold text-text-primary sm:text-4xl">
              {profile.name}
            </Heading>
            {profile.is_verified && (
              <BadgeCheck className="h-6 w-6 shrink-0 text-action" aria-label={t('verified')} />
            )}
          </div>

          {/* Role badges */}
          {(profile.is_staff || profile.is_technician) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.is_staff && (
                <span className="inline-flex items-center gap-1 rounded-full border border-action/30 bg-action-muted px-2.5 py-0.5 text-xs font-medium text-action">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t('badgeStaff')}
                </span>
              )}
              {profile.is_technician && (
                <span className="inline-flex items-center gap-1 rounded-full border border-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  <Wrench className="h-3.5 w-3.5" /> {t('badgeTechnician')}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />{' '}
              {t('memberSince', { date: formatDateShort(profile.member_since) })}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats — glance line on phones, tiles from sm up */}
      {stats.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary sm:hidden">
            {stats.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className="font-mono font-semibold tabular-nums text-text-primary">
                  {s.value}
                </span>
                {s.label}
              </span>
            ))}
          </div>
          <div
            className="mt-6 hidden overflow-hidden rounded-xl border border-subtle bg-surface-base sm:grid sm:divide-x sm:divide-subtle"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
            {stats.map((s) => (
              <div key={s.label} className="p-4">
                <div className="flex items-center gap-1.5">
                  <s.icon className="h-4 w-4 text-text-tertiary" />
                  <span className="font-mono text-xl font-semibold tabular-nums text-text-primary">
                    {s.value}
                  </span>
                </div>
                <div className="mt-1 text-xs text-text-tertiary">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
