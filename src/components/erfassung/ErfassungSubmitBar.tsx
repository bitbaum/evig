'use client'

import { Link } from '@/i18n/navigation'
import { Save, Loader2, Package, PackageCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requiresQualityControl } from '@/config/intake-checklist'

interface Props {
  isEditMode: boolean
  /** Physische Annahme — single "Gerät erfassen" action into the pipeline. */
  isAnnahmeMode?: boolean
  isLoading: boolean
  /** Direct shop publication is only offered for a classified non-QC item. */
  category?: string
  // SyntheticEvent — both <form onSubmit> and inline buttons need to invoke this
  onSubmit: (e: React.SyntheticEvent, action: 'draft' | 'erfassen' | 'publish') => void
}

export function ErfassungSubmitBar({ isEditMode, isAnnahmeMode = false, isLoading, category = '', onSubmit }: Props) {
  const t = useTranslations('components.erfassung.submitBar')
  const canPublishDirectly = Boolean(category) && !requiresQualityControl(category)

  // Spinner replaces the ICON, never the label — three anonymous spinning
  // pills told the user nothing about what was happening.
  const iconOrSpinner = (Icon: typeof Save) =>
    isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />

  if (isAnnahmeMode) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden sm:flex justify-between items-center pt-4">
          <Link
            href={ROUTES.admin.intake}
            className="inline-flex items-center justify-center rounded-md font-medium px-6 py-3 border border-default bg-surface-base hover:bg-surface-raised text-text-primary"
          >
            {t('cancel')}
          </Link>
          <Button
            type="button"
            onClick={(e) => onSubmit(e, 'erfassen')}
            disabled={isLoading}
            variant="primary"
            className="gap-2 px-6 py-3"
          >
            {iconOrSpinner(PackageCheck)} {t('captureAnnahme')}
          </Button>
        </div>

        {/* Mobile — above the admin bottom nav, same as the standard bar */}
        <div className="sm:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 bg-surface-base border-t border p-4 z-40">
          <Button
            type="button"
            onClick={(e) => onSubmit(e, 'erfassen')}
            disabled={isLoading}
            variant="primary"
            className="w-full gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
          >
            {iconOrSpinner(PackageCheck)}
            <span>{t('captureAnnahme')}</span>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex justify-between items-center pt-4">
        <Link
          href={ROUTES.admin.intake}
          className="inline-flex items-center justify-center rounded-md font-medium px-6 py-3 border border-default bg-surface-base hover:bg-surface-raised text-text-primary"
        >
          {t('cancel')}
        </Link>

        <div className="flex gap-3">
          {isEditMode ? (
            <Button type="submit" disabled={isLoading} className="gap-2 px-6 py-3">
              {iconOrSpinner(Save)} {isLoading ? t('saving') : t('saveChanges')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'draft')}
                disabled={isLoading}
                className="gap-2 px-5 py-3 bg-surface-overlay hover:bg-surface-overlay disabled:bg-surface-overlay"
              >
                {iconOrSpinner(Save)} {t('draft')}
              </Button>

              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'erfassen')}
                disabled={isLoading}
                variant="primary" className="gap-2 px-5 py-3 disabled:bg-action"
              >
                {iconOrSpinner(Package)} {t('capture')}
              </Button>

              {canPublishDirectly && (
                <Button
                  type="button"
                  onClick={(e) => onSubmit(e, 'publish')}
                  disabled={isLoading}
                  className="gap-2 px-5 py-3"
                >
                  {iconOrSpinner(Package)} {t('captureAndShop')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar — sits ABOVE the admin bottom nav (h-14 +
          safe area), which is also fixed at bottom-0 with the same z-index;
          anchored at 0 the two bars stacked on top of each other and the
          submit buttons were half-covered. */}
      <div className="sm:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 bg-surface-base border-t border p-4 z-40">
        {isEditMode ? (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            disabled={isLoading}
            className="w-full gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
          >
            {iconOrSpinner(Save)}
            <span>{t('saveChanges')}</span>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={(e) => onSubmit(e, 'draft')}
              disabled={isLoading}
              aria-label={t('draft')}
              className="gap-1 px-3 py-4 rounded-xl touch-manipulation min-h-[52px] bg-surface-overlay hover:bg-surface-overlay disabled:bg-surface-overlay"
            >
              {iconOrSpinner(Save)}
            </Button>

            <Button
              type="button"
              onClick={(e) => onSubmit(e, 'erfassen')}
              disabled={isLoading}
              variant="primary" className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px] disabled:bg-action"
            >
              {iconOrSpinner(Package)}
              <span>{t('capture')}</span>
            </Button>

            {canPublishDirectly && (
              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'publish')}
                disabled={isLoading}
                className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
              >
                {iconOrSpinner(Package)}
                <span>{t('captureAndShopShort')}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
