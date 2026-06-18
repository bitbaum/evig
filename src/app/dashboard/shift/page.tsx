/**
 * /dashboard/shift — retired.
 *
 * Clock-in/out is no longer a separate screen; it's an integral, optional
 * widget inside the timecard tool (/dashboard/timecards). This route now
 * permanently redirects there so old links/bookmarks keep working.
 */
import { redirect } from 'next/navigation'

export default function ShiftPage() {
  redirect('/dashboard/timecards')
}
