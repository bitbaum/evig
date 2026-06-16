import { redirect } from 'next/navigation'

/** Seller stats live on listings — skip the extra hub click. */
export default function SellerDashboardRedirect() {
  redirect('/dashboard/listings')
}
