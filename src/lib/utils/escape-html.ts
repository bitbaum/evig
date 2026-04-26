/**
 * HTML-entity escape: turn user-controlled text into something safe to drop
 * inside HTML element bodies or attribute values.
 *
 * Use whenever a string travels into rendered HTML without going through
 * React's automatic escaping — inline <script> bodies, generated HTML
 * email templates, dangerouslySetInnerHTML, etc.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
