/**
 * Location Form Components
 *
 * Decomposed from admin/locations/new/page.tsx (614 lines)
 */

// Components
export { LocationBasicInfoSection } from './LocationBasicInfoSection'
export { LocationAddressSection } from './LocationAddressSection'
export { LocationFacilitiesSection } from './LocationFacilitiesSection'
export { LocationAccessibilitySection } from './LocationAccessibilitySection'
export { LocationContactSection } from './LocationContactSection'

// Hooks
export { useLocationForm } from './useLocationForm'

// Types & Constants
export type { LocationFormData, AccessibilityInfo, LocationType, SubmitResult } from './types'
export { LOCATION_TYPES, FACILITIES, SWISS_CANTONS, INITIAL_LOCATION_FORM_DATA } from './types'
