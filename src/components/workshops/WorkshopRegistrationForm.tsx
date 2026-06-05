'use client'

/**
 * Workshop Registration Form
 *
 * Refactored to use extracted components for better maintainability.
 * Uses Payrexx redirect-based payment (no embedded Stripe Elements).
 *
 * Components extracted:
 * - PaymentForm
 * - WorkshopLoginPrompt
 * - WorkshopInstanceCard
 * - RegistrationSuccessCard
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import {
  PaymentForm,
  WorkshopLoginPrompt,
  WorkshopInstanceCard,
  RegistrationSuccessCard,
  type Workshop,
  type WorkshopInstanceWithCount,
  type RegistrationData,
  type PaymentData,
  type RegistrationUIStatus,
} from './index'

interface WorkshopRegistrationFormProps {
  workshop: Workshop
  instance: WorkshopInstanceWithCount
}

export default function WorkshopRegistrationForm({ workshop, instance }: WorkshopRegistrationFormProps) {
  const t = useTranslations('workshops.registration')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationUIStatus] = useState<RegistrationUIStatus>('checking')
  // Registration data stored for potential future use (e.g., showing details in success state)
  const [_registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string>('')

  const requiresPayment = workshop.price_cents > 0
  const isFull = instance.current_participants >= workshop.max_participants
  const spotsLeft = workshop.max_participants - instance.current_participants

  useEffect(() => {
    const checkRegistrationUIStatus = async () => {
      try {
        const result = await apiFetch<{ registered: boolean; registration?: RegistrationData }>(`/api/workshops/registration/${instance.id}`)

        if (result.data?.registered) {
          setRegistrationUIStatus('registered')
          setRegistrationData(result.data.registration ?? null)
        } else {
          setRegistrationUIStatus('not-registered')
        }
      } catch (err) {
        logger.error('Error checking registration', { error: err })
        setRegistrationUIStatus('error')
        setError(t('loadError'))
      }
    }

    if (session?.user) {
      checkRegistrationUIStatus()
    } else if (status !== 'loading') {
      const frame = requestAnimationFrame(() => setRegistrationUIStatus('not-registered'))
      return () => cancelAnimationFrame(frame)
    }
  }, [session, status, instance.id, t])

  const handleFreeRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationUIStatus('registering')
    setError('')

    try {
      const result = await apiFetch<{ registrationId: string }>('/api/workshops/register', {
        method: 'POST',
        body: {
          workshopSlug: workshop.slug,
          instanceId: instance.id
        }
      })

      if (result.success) {
        setRegistrationUIStatus('registered')
        setRegistrationData({
          id: result.data!.registrationId,
          status: WORKSHOP_REGISTRATION_STATUS.CONFIRMED,
          registered_at: new Date().toISOString(),
          workshop_instance: {
            start_date: instance.start_date,
            location: instance.location,
            workshop_title: workshop.title,
            workshop_slug: workshop.slug
          }
        })

        setTimeout(() => {
          router.push('/dashboard/workshops')
        }, 2000)
      } else {
        setRegistrationUIStatus('error')
        setError(result.error || t('registrationFailed'))
      }
    } catch {
      setRegistrationUIStatus('error')
      setError(t('networkError'))
    }
  }

  const handlePaidRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationUIStatus('processing')
    setError('')

    try {
      const result = await apiFetch<{ registrationId: string; paymentUrl: string; amount: string; invoiceNumber: string }>(`/api/workshops/${workshop.slug}/register-with-payment`, {
        method: 'POST',
        body: {
          instanceId: instance.id,
          useEscrow: false
        }
      })

      if (result.success) {
        setPaymentData({
          registrationId: result.data!.registrationId,
          paymentUrl: result.data!.paymentUrl,
          amount: result.data!.amount,
          invoiceNumber: result.data!.invoiceNumber
        })
        setRegistrationUIStatus('payment')
      } else {
        setRegistrationUIStatus('error')
        setError(result.error || t('processingError'))
      }
    } catch {
      setRegistrationUIStatus('error')
      setError(t('networkError'))
    }
  }

  // Loading state
  if (status === 'loading' || registrationStatus === 'checking') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-action mx-auto mb-3" />
        <p className="text-text-secondary">{t('loading')}</p>
      </div>
    )
  }

  // Not logged in
  if (!session?.user) {
    return <WorkshopLoginPrompt />
  }

  // Success state
  if (registrationStatus === 'success' || registrationStatus === 'registered') {
    return (
      <RegistrationSuccessCard
        requiresPayment={requiresPayment}
        isPaymentSuccess={registrationStatus === 'success'}
        invoiceNumber={paymentData?.invoiceNumber}
      />
    )
  }

  // Full workshop
  if (isFull) {
    return (
      <div>
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('fullHeading')}</Heading>

        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 mb-4">
          <div className="flex items-center text-error-800 dark:text-error-400 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">{t('fullNoSpots')}</span>
          </div>
          <p className="text-error-700 dark:text-error-400 text-sm">
            {t('fullMessage')}
          </p>
        </div>

        <Button
          type="button"
          disabled
          className="w-full bg-surface-overlay text-text-tertiary cursor-not-allowed"
        >
          {t('fullButton')}
        </Button>
      </div>
    )
  }

  // Error state
  if (registrationStatus === 'error') {
    return (
      <div>
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('errorHeading')}</Heading>

        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 mb-4">
          <div className="flex items-center text-error-800 dark:text-error-400 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">{t('errorTitle')}</span>
          </div>
          <p className="text-error-700 dark:text-error-400 text-sm">{error}</p>
        </div>

        <Button
          type="button"
          onClick={() => setRegistrationUIStatus('not-registered')}
          className="w-full bg-surface-overlay text-white hover:bg-surface-overlay"
        >
          {t('retryButton')}
        </Button>
      </div>
    )
  }

  // Payment step — show summary + redirect button
  if (registrationStatus === 'payment' && paymentData) {
    return (
      <div>
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('paymentHeading')}</Heading>

        {/* Payment Summary */}
        <div className="bg-surface-raised rounded-lg p-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('paymentWorkshopLabel')}</span>
              <span className="font-medium">{workshop.title}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">{t('paymentAmountLabel')}</span>
              <span className="font-semibold text-action">CHF {paymentData.amount}</span>
            </div>
          </div>
        </div>

        {/* Payrexx Payment Form (redirect button) */}
        <PaymentForm
          paymentUrl={paymentData.paymentUrl}
          amount={paymentData.amount}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRegistrationUIStatus('not-registered')}
          className="w-full mt-3 text-text-secondary hover:text-text-primary"
        >
          {t('cancelButton')}
        </Button>
      </div>
    )
  }

  // Processing state
  if (registrationStatus === 'processing' || registrationStatus === 'registering') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-action mx-auto mb-3" />
        <p className="text-text-secondary">
          {registrationStatus === 'processing'
            ? t('preparingPayment')
            : t('registering')
          }
        </p>
      </div>
    )
  }

  // Default: Registration form
  return (
    <div>
      <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('registerHeading')}</Heading>

      <WorkshopInstanceCard
        instance={instance}
        spotsLeft={spotsLeft}
        priceCents={workshop.price_cents}
      />

      {/* Registration Button */}
      <Button
        onClick={requiresPayment ? handlePaidRegistration : handleFreeRegistration}
        variant="primary"
        className="w-full"
      >
        {requiresPayment ? (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {t('registerPaid')}
          </>
        ) : (
          t('registerFree')
        )}
      </Button>

      {/* Info */}
      <p className="text-xs text-text-tertiary mt-3 text-center">
        {requiresPayment
          ? t('paymentNote')
          : t('confirmationNote')
        }
      </p>
    </div>
  )
}
