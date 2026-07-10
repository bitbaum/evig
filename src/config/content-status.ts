/**
 * Publish-status labels for the admin content surfaces (blog list, pages list,
 * blog editor sidebar). One source so the three don't drift. The admin UI is
 * German (not i18n'd), so the labels live here as constants.
 */
export const CONTENT_PUBLISH_LABELS = {
  published: 'Veröffentlicht',
  draft: 'Entwurf',
} as const

export function publishStatusLabel(isPublished: boolean | null | undefined): string {
  return isPublished ? CONTENT_PUBLISH_LABELS.published : CONTENT_PUBLISH_LABELS.draft
}
