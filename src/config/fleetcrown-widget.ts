/**
 * FleetCrown feedback widget — replaces the in-repo SuggestionButton
 * (revampit is FleetCrown's customer #1 for the embeddable widget).
 *
 * Submissions go to FleetCrown's per-project inbox and become dispatchable
 * agent work there. The token is public by design: it authorizes only
 * writing feedback into the revampit project inbox, never reading, and the
 * FleetCrown side enforces an origin allowlist (revamp-it.ch) plus rate
 * limits. Historical submissions stay readable at /admin/feedback.
 */
export const FLEETCROWN_WIDGET = {
  scriptUrl: 'https://fleetcrown.orangecat.ch/widget.js',
  projectToken: 'fcw_45baa3d5c31f7cde10d65c168f6b9df9',
  /** px from the bottom edge — stacks the launcher above the Hirn FAB. */
  fabBottomPx: 88,
} as const
