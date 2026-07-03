import { redirect } from 'next/navigation'

/**
 * /admin/workshops/proposals has no own list page — proposals are triaged on
 * /admin/workshops (and inline in the Freigaben hub). This stub keeps every
 * existing deep link working: dashboard quick action, routes.ts workshopsNew,
 * /admin/workshops/new, and proposal-notification EMAILS already in inboxes.
 */
export default function WorkshopProposalsIndexRedirect() {
  redirect('/admin/workshops')
}
