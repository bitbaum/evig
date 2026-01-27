import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { REPAIRER_ONBOARDING } from '@/config/onboarding'
import { OnboardingInfoPage } from '@/components/onboarding/OnboardingInfoPage'

export const metadata: Metadata = {
  title: REPAIRER_ONBOARDING.meta.title,
  description: REPAIRER_ONBOARDING.meta.description,
}

export default async function RepairerOnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string
  const shouldRedirect = REPAIRER_ONBOARDING.roleCheck.redirectRoles.includes(userRole)

  if (shouldRedirect) {
    redirect(REPAIRER_ONBOARDING.roleCheck.redirectTo)
  }

  return <OnboardingInfoPage config={REPAIRER_ONBOARDING} />
}
