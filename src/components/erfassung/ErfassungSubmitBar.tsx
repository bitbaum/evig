'use client'

import { Link } from '@/i18n/navigation'
import {
  Archive,
  Loader2,
  Recycle,
  Save,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import {
  CAPTURE_DESTINATIONS,
  type CaptureDestination,
} from '@/config/intake-workflow'

interface Props {
  isEditMode: boolean
  isLoading: boolean
  destination: CaptureDestination
  canSubmit: boolean
  onSubmit: (event: React.SyntheticEvent, action: 'draft' | 'erfassen' | 'publish') => void
}

const DESTINATION_ICONS = {
  [CAPTURE_DESTINATIONS.QUALITY]: ShieldCheck,
  [CAPTURE_DESTINATIONS.INVENTORY]: Archive,
  [CAPTURE_DESTINATIONS.SHOP_UNTESTED]: Store,
  [CAPTURE_DESTINATIONS.PARTS]: Wrench,
  [CAPTURE_DESTINATIONS.RECYCLE]: Recycle,
} as const

/** One destination, one primary action. */
export function ErfassungSubmitBar({
  isEditMode,
  isLoading,
  destination,
  canSubmit,
  onSubmit,
}: Props) {
  const t = useTranslations('components.erfassung.submitBar')
  const DestinationIcon = DESTINATION_ICONS[destination]

  const submit = (event: React.SyntheticEvent) =>
    onSubmit(event, destination === CAPTURE_DESTINATIONS.SHOP_UNTESTED ? 'publish' : 'erfassen')

  const content = isLoading ? (
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
  ) : isEditMode ? (
    <Save className="h-5 w-5" aria-hidden="true" />
  ) : (
    <DestinationIcon className="h-5 w-5" aria-hidden="true" />
  )

  const label = isEditMode
    ? isLoading ? t('saving') : t('saveChanges')
    : t(`destinationActions.${destination}`)

  return (
    <>
      <div className="hidden items-center justify-between border-t border-subtle pt-4 sm:flex">
        <Link
          href={ROUTES.admin.intake}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-default bg-surface-base px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-raised"
        >
          {t('cancel')}
        </Link>
        <Button
          type={isEditMode ? 'submit' : 'button'}
          onClick={isEditMode ? undefined : submit}
          disabled={isLoading || !canSubmit}
          variant="primary"
          className="min-h-11 gap-2 px-6"
        >
          {content}
          {label}
        </Button>
      </div>

      <div className="fixed bottom-[var(--bottom-nav-clearance,0px)] left-0 right-0 z-40 border-t border-default bg-surface-base p-3 sm:hidden">
        <Button
          type="button"
          onClick={(event) => {
            if (isEditMode) {
              event.preventDefault()
              document.querySelector<HTMLFormElement>('form[data-product-form]')?.requestSubmit()
              return
            }
            submit(event)
          }}
          disabled={isLoading || !canSubmit}
          variant="primary"
          className="min-h-[52px] w-full gap-2 rounded-xl"
        >
          {content}
          {label}
        </Button>
      </div>
    </>
  )
}
