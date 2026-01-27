import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SELLER_ONBOARDING } from '@/config/onboarding'
import { OnboardingInfoPage } from '@/components/onboarding/OnboardingInfoPage'

export const metadata: Metadata = {
  title: SELLER_ONBOARDING.meta.title,
  description: SELLER_ONBOARDING.meta.description,
}

export default async function SellerOnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string
  const shouldRedirect = SELLER_ONBOARDING.roleCheck.redirectRoles.includes(userRole)

  if (shouldRedirect) {
    redirect(SELLER_ONBOARDING.roleCheck.redirectTo)
  }

  return <OnboardingInfoPage config={SELLER_ONBOARDING} />
}
