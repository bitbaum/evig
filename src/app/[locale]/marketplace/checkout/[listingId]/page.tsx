import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getListingForCheckout } from '@/lib/marketplace/checkout-listing'
import { CheckoutPageClient } from './CheckoutPageClient'
import { ROUTES } from '@/config/routes'

interface CheckoutPageProps {
  params: Promise<{ listingId: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { listingId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(
      `${ROUTES.public.login}?callbackUrl=${encodeURIComponent(ROUTES.public.marketplaceCheckout(listingId))}`,
    )
  }

  const listing = await getListingForCheckout(listingId)
  if (!listing) notFound()

  return (
    <CheckoutPageClient
      initialListing={listing}
      sessionUserId={session.user.id}
    />
  )
}
