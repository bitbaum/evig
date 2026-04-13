// Erfassung is the canonical product intake UI for RevampIT staff.
// This route is superseded by /admin/erfassung which provides AI camera extraction,
// bulk entry, and voice input — capabilities this simpler form never had.
import { redirect } from 'next/navigation'

export default function NewProductPage() {
  redirect('/admin/erfassung')
}
