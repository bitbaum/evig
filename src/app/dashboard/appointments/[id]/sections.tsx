/**
 * Presentation cards for the service appointment detail page (`/dashboard/appointments/[id]`).
 *
 * Barrel re-export — each card lives in `./sections/*`; page.tsx composes them.
 * State + actions live in useBookingDetail.
 */

export { StarDisplay } from './sections/StarDisplay'
export { BookingHeaderCard } from './sections/BookingHeaderCard'
export { ServiceDetailsCard } from './sections/ServiceDetailsCard'
export { TechnicianCard } from './sections/TechnicianCard'
export { DatesCard } from './sections/DatesCard'
export { LocationCard } from './sections/LocationCard'
export { RatingCard } from './sections/RatingCard'
