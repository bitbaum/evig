/**
 * Guard: `messages/de.json → admin.sections` mirrors `src/config/sections.ts`.
 *
 * The admin nav is localized: section/group labels render through the
 * `admin.sections` message namespace (see src/lib/section-labels.ts), while
 * the canonical German strings live in the sections config SSOT. de.json must
 * therefore be an exact 1:1 mirror of the config — if either side changes
 * without the other, translations silently drift from what German admins see.
 * This test turns that drift into a build failure.
 *
 * Also guards translated locales against orphan keys: every section id/field
 * a locale translates must exist in DE (typos would otherwise never surface —
 * the deep-merge fallback hides them).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SECTIONS, SIDEBAR_GROUPS } from '../sections'

const MESSAGES_DIR = join(__dirname, '../../../messages')
const LOCALES = ['en', 'fr', 'it', 'es', 'ja', 'ko', 'ru']

interface SectionEntry {
  label: string
  description: string
  shortLabel?: string
}

interface SectionsMessages {
  items: Record<string, SectionEntry>
  groups: Record<string, string>
}

function readSectionsMessages(locale: string): SectionsMessages | undefined {
  const messages = JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8'))
  return messages.admin?.sections
}

const adminSections = Object.values(SECTIONS).filter(s => s.visibility.admin)
const de = readSectionsMessages('de')

describe('admin.sections in de.json mirrors src/config/sections.ts', () => {
  it('exists in de.json', () => {
    expect(de).toBeDefined()
  })

  it('has an entry for every admin-visible section, and no orphans', () => {
    const configIds = adminSections.map(s => s.id).sort()
    const messageIds = Object.keys(de!.items).sort()
    expect(messageIds).toEqual(configIds)
  })

  it.each(adminSections.map(s => [s.id, s] as const))(
    'section %s: label/description/shortLabel match the config',
    (_id, section) => {
      const entry = de!.items[section.id]
      expect(entry.label).toBe(section.ui.label)
      expect(entry.description).toBe(section.ui.description)
      const shortLabel =
        'mobileBottomNavLabel' in section.ui ? section.ui.mobileBottomNavLabel : undefined
      expect(entry.shortLabel).toBe(shortLabel)
    }
  )

  it('has every sidebar group, with matching German labels', () => {
    const groups = Object.values(SIDEBAR_GROUPS)
    expect(Object.keys(de!.groups).sort()).toEqual(groups.map(g => g.id).sort())
    for (const group of groups) {
      expect(de!.groups[group.id]).toBe(group.label)
    }
  })
})

describe.each(LOCALES)('admin.sections in %s.json has no orphan keys', locale => {
  const localeSections = readSectionsMessages(locale)

  it('only translates section ids and fields that exist in DE', () => {
    if (!localeSections) return // locale may omit the namespace entirely
    for (const [id, entry] of Object.entries(localeSections.items ?? {})) {
      const deEntry = de!.items[id]
      expect(deEntry).toBeDefined()
      for (const field of Object.keys(entry)) {
        expect(deEntry).toHaveProperty(field)
      }
    }
    for (const groupId of Object.keys(localeSections.groups ?? {})) {
      expect(de!.groups).toHaveProperty(groupId)
    }
  })
})
