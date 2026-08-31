'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { getMobileBottomNavSections } from '@/config/sections';
import { sectionShortLabel } from '@/lib/section-labels';

interface MobileBottomNavProps {
  accessibleSections: string[];
  onMenuClick: () => void;
}

/**
 * Admin mobile bottom nav — permission-filtered sections + Mehr.
 *
 * Items are derived from `sections.ts` via `mobileBottomNavOrder`. To
 * change what shows up here, flag the section with a `mobileBottomNavOrder`
 * rank and optionally `ui.mobileBottomNavLabel` for a shorter label that
 * fits the bar (localized via `admin.sections.items.*.shortLabel`). The
 * SSOT stays in one file; nothing about this component knows which routes
 * are "important enough."
 */
export function MobileBottomNav({ accessibleSections, onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const sections = getMobileBottomNavSections(accessibleSections);
  const t = useTranslations('admin.sidebar');
  const tSections = useTranslations('admin.sections');

  const items = sections.map((section) => ({
    key: section.id,
    href: section.path,
    label: sectionShortLabel(tSections, section),
    icon: section.ui.icon,
    // Dashboard ("/admin") needs exact-match so it isn't lit for every
    // /admin/* page; everything else uses prefix-match.
    active:
      section.path === '/admin' ? pathname === section.path : pathname.startsWith(section.path),
  }));

  return (
    <BottomNav
      items={items}
      ariaLabel={t('navAria')}
      more={{ label: t('mobileMore'), ariaLabel: t('openAria'), onClick: onMenuClick }}
    />
  );
}
