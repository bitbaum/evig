'use client'

import { useEffect } from 'react'

const WIDGET_SRC = 'https://fleetcrown.orangecat.ch/widget.js'
const PROJECT_TOKEN = 'fcw_45baa3d5c31f7cde10d65c168f6b9df9'
/** Sits above HirnPublicFab (bottom-6 + h-14 ≈ 80px) so the two FABs stack. */
const BOTTOM_OFFSET_PX = '88'

/**
 * FleetCrown embeddable feedback widget (revampit = customer #1).
 *
 * Replaces the in-repo React widget (SuggestionButton et al.): feedback now
 * flows into the FleetCrown project inbox where it can be dispatched to an
 * agent as a fix-task, instead of the local site_suggestions table. The token
 * is write-only and public by design; the server enforces an Origin allowlist
 * (www.revamp-it.ch / revamp-it.ch), so the widget renders on localhost but
 * submissions only succeed from prod.
 */
export function FleetCrownFeedbackEmbed() {
  useEffect(() => {
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return
    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.setAttribute('data-fc-project', PROJECT_TOKEN)
    script.setAttribute('data-fc-bottom', BOTTOM_OFFSET_PX)
    document.body.appendChild(script)
    // No cleanup: the widget mounts once per page load and MainLayout wraps
    // every non-lean page, so unmount/remount churn would only flicker the FAB.
  }, [])

  return null
}
