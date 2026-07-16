/**
 * Localized admin section/group labels — SSOT for resolving them.
 *
 * Structure (ids, icons, paths, visibility) lives in `src/config/sections.ts`;
 * the canonical German strings live there too and are mirrored 1:1 into
 * `messages/de.json` under `admin.sections` (guarded by
 * `src/config/__tests__/admin-sections-i18n.test.ts`). Other locales translate
 * those keys; anything untranslated falls back to German via the message
 * deep-merge — and, defensively, to the config string here if a key is
 * missing entirely (e.g. a freshly added section before its keys land).
 */
import type { useTranslations } from 'next-intl'
import type { SectionConfig, SidebarGroup } from '@/config/sections'

/** Translator scoped to `admin.sections` (client `useTranslations` or server
 *  `getTranslations`). */
export type SectionsT = ReturnType<typeof useTranslations<'admin.sections'>>
type SectionsKey = Parameters<SectionsT>[0]

/** Low-level resolver: message key → translated string, else `fallback`. */
export function sectionText(
  t: SectionsT,
  sectionId: string,
  field: 'label' | 'description' | 'shortLabel',
  fallback: string
): string {
  const key = `items.${sectionId}.${field}` as SectionsKey
  return t.has(key) ? t(key) : fallback
}

export function sectionLabel(t: SectionsT, section: SectionConfig): string {
  return sectionText(t, section.id, 'label', section.ui.label)
}

export function sectionDescription(t: SectionsT, section: SectionConfig): string {
  return sectionText(t, section.id, 'description', section.ui.description)
}

/** Short label for the mobile bottom nav; falls back to the full label. */
export function sectionShortLabel(t: SectionsT, section: SectionConfig): string {
  const key = `items.${section.id}.shortLabel` as SectionsKey
  if (t.has(key)) return t(key)
  return section.ui.mobileBottomNavLabel ?? sectionLabel(t, section)
}

export function groupLabel(t: SectionsT, group: Pick<SidebarGroup, 'id' | 'label'>): string {
  const key = `groups.${group.id}` as SectionsKey
  return t.has(key) ? t(key) : group.label
}
