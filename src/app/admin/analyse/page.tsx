/**
 * Admin Analyse Overview Page
 *
 * Overview of all analytics sections.
 * Redirects to Finanzen by default.
 */

import { redirect } from 'next/navigation'

export default function AnalysePage() {
  // Redirect to the first analyse section
  redirect('/admin/analyse/finanzen')
}
