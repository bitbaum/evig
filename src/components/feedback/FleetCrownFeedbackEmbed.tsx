'use client'

import { useEffect } from 'react'
import { FLEETCROWN_WIDGET } from '@/config/fleetcrown-widget'

/**
 * Mounts the FleetCrown feedback widget (element/page/site scopes, element
 * picker) via its script-tag embed — the same integration any FleetCrown
 * customer site uses. Imperative injection so unmount cleans up both the
 * script and the widget's host element.
 */
export function FleetCrownFeedbackEmbed() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = FLEETCROWN_WIDGET.scriptUrl
    script.async = true
    script.setAttribute('data-fc-project', FLEETCROWN_WIDGET.projectToken)
    script.setAttribute('data-fc-bottom', String(FLEETCROWN_WIDGET.fabBottomPx))
    document.body.appendChild(script)
    return () => {
      script.remove()
      document.getElementById('fleetcrown-feedback-host')?.remove()
    }
  }, [])

  return null
}
