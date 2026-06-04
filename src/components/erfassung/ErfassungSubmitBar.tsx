'use client'

import { Link } from '@/i18n/navigation'
import { Save, Loader2, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

interface Props {
  isEditMode: boolean
  isLoading: boolean
  // SyntheticEvent — both <form onSubmit> and inline buttons need to invoke this
  onSubmit: (e: React.SyntheticEvent, action: 'draft' | 'erfassen' | 'publish') => void
}

export function ErfassungSubmitBar({ isEditMode, isLoading, onSubmit }: Props) {
  const t = useTranslations('components.erfassung.submitBar')

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex justify-between items-center pt-4">
        <Link
          href={ROUTES.admin.products}
          className="inline-flex items-center justify-center rounded-md font-medium px-6 py-3 border border-neutral-300 bg-surface-base hover:bg-neutral-50 text-text-primary"
        >
          {t('cancel')}
        </Link>

        <div className="flex gap-3">
          {isEditMode ? (
            <Button type="submit" disabled={isLoading} className="gap-2 px-6 py-3">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('saving')}</>
              ) : (
                <><Save className="w-5 h-5" /> {t('saveChanges')}</>
              )}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'draft')}
                disabled={isLoading}
                className="gap-2 px-5 py-3 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-400"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Save className="w-5 h-5" /> {t('draft')}</>
                )}
              </Button>

              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'erfassen')}
                disabled={isLoading}
                variant="primary" className="gap-2 px-5 py-3 disabled:bg-primary-400"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> {t('capture')}</>
                )}
              </Button>

              <Button
                type="button"
                onClick={(e) => onSubmit(e, 'publish')}
                disabled={isLoading}
                className="gap-2 px-5 py-3"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> {t('captureAndShop')}</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface-base dark:bg-neutral-800 border-t border dark:border-neutral-700 p-4 z-50 safe-area-inset-bottom">
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
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{t('saveChanges')}</span>
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={(e) => onSubmit(e, 'draft')}
              disabled={isLoading}
              className="gap-1 px-3 py-4 rounded-xl touch-manipulation min-h-[52px] bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-400"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </Button>

            <Button
              type="button"
              onClick={(e) => onSubmit(e, 'erfassen')}
              disabled={isLoading}
              variant="primary" className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px] disabled:bg-primary-400"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>{t('capture')}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={(e) => onSubmit(e, 'publish')}
              disabled={isLoading}
              className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>+ Shop</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
