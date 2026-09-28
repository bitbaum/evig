import { Check, Circle, ListChecks, Unplug } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { DevelopmentProfile } from 'bip-kit';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import Heading from '@/components/ui/Heading';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ROUTES } from '@/config/routes';
import { FLEET_PROFILE_URL } from '@/config/development-records';
import { designPrimitive } from '@/lib/design-system';
import {
  groupRoadmap,
  milestoneRows,
  roadmapProgress,
  type RoadmapItem,
} from '@/lib/development-records';
import { cn } from '@/lib/utils';

/**
 * The roadmap as evig renders it. The DATA is the fleet map's projection of
 * ROADMAP.md (see src/config/development-records.ts); only the markup is ours,
 * so the page keeps the site's chrome instead of bip-kit's neutral stylesheet.
 */

interface RoadmapRecordProps {
  profile: DevelopmentProfile | null;
  locale: string;
}

export async function RoadmapRecord({ profile, locale }: RoadmapRecordProps) {
  const t = await getTranslations({ locale, namespace: 'roadmap' });

  if (!profile) {
    return (
      <EmptyState
        icon={Unplug}
        title={t('unavailable.title')}
        description={t('unavailable.description')}
        action={<RecordLinks changelog={t('links.changelog')} profile={t('links.profile')} />}
      />
    );
  }

  const groups = groupRoadmap(profile.roadmap);
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={t('empty.title')}
        description={t('empty.description')}
        action={<RecordLinks changelog={t('links.changelog')} profile={t('links.profile')} />}
      />
    );
  }

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={`${group.key}:${group.rawStatus ?? ''}`}>
          <Eyebrow as="h2" className="mb-4">
            {group.rawStatus ?? t(`status.${group.key as Exclude<typeof group.key, 'other'>}`)}
          </Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => (
              <RoadmapCard
                key={item.title}
                item={item}
                progressLabel={t('progress', { percent: roadmapProgress(item) ?? 0 })}
                targetLabel={item.targetDate ? t('target', { date: item.targetDate }) : null}
                milestonesLabel={t('milestones')}
              />
            ))}
          </div>
        </section>
      ))}
      <RecordLinks changelog={t('links.changelog')} profile={t('links.profile')} />
    </div>
  );
}

interface RoadmapCardProps {
  item: RoadmapItem;
  progressLabel: string;
  targetLabel: string | null;
  milestonesLabel: string;
}

function RoadmapCard({ item, progressLabel, targetLabel, milestonesLabel }: RoadmapCardProps) {
  const progress = roadmapProgress(item);
  const rows = milestoneRows(item.milestones);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="space-y-1">
        <Heading level={3} variant="admin" className="text-base text-text-primary">
          {item.title}
        </Heading>
        {targetLabel && <p className={designPrimitive.type.meta}>{targetLabel}</p>}
      </div>

      {progress != null && (
        <div className="space-y-1">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={progressLabel}
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
          >
            <div className="h-full rounded-full bg-action" style={{ width: `${progress}%` }} />
          </div>
          <p className={designPrimitive.type.meta}>{progressLabel}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p className={cn(designPrimitive.type.tableHeader, 'mb-2')}>{milestonesLabel}</p>
          <ul className="space-y-1.5">
            {rows.map((row) => (
              <li
                key={row.title}
                className={cn(
                  'flex items-start gap-2 text-sm',
                  row.done ? 'text-text-tertiary' : 'text-text-secondary',
                )}
              >
                {row.done ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                )}
                <span className={row.done ? 'line-through' : undefined}>{row.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function RecordLinks({ changelog, profile }: { changelog: string; profile: string }) {
  const link = 'inline-flex min-h-touch items-center text-sm text-action hover:underline';
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
      <Link href={ROUTES.public.changelog} className={link}>
        {changelog}
      </Link>
      <a href={FLEET_PROFILE_URL} className={link} rel="noopener noreferrer">
        {profile}
      </a>
    </div>
  );
}
