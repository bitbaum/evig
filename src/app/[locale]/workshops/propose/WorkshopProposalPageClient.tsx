'use client'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { WorkshopProposalForm } from './components/WorkshopProposalForm'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'
import { PageShell } from '@/components/layout/PageShell'

export default function WorkshopProposalPage() {
  const { data: session } = useSession()
  const t = useTranslations('workshops.propose')

  if (!session?.user) {
    return (
      <PageShell maxWidth="2xl" py="py-12">
          <div className="card-shell p-8 text-center">
            <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
            <Heading level={1} className={`${responsiveTypography.subsection} text-text-primary mb-4`}>
              {t('loginRequired')}
            </Heading>
            <p className="text-text-secondary mb-6">
              {t('loginPrompt')}
            </p>
            <Button as={Link} href={ROUTES.public.login} variant="primary" size="lg">
              {t('loginButton')}
            </Button>
          </div>
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="4xl" py="py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-action-muted-muted rounded-full mb-6">
              <GraduationCap className="w-8 h-8 text-action" />
            </div>
            <Heading level={1} className={`${responsiveTypography.section} text-text-primary mb-2`}>
              {t('title')}
            </Heading>
            <p className="text-text-secondary">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <WorkshopProposalForm />
    </PageShell>
  )
}
