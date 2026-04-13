'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { adminBtn, type AdminBtnVariant } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminBtnVariant
  href?: never
}

interface AdminLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  variant?: AdminBtnVariant
  /** Render as a Next.js Link instead of a button */
  href: string
}

type Props = AdminButtonProps | AdminLinkProps

/**
 * AdminButton — standard admin action button.
 *
 * variant="primary"      green — create, save, submit
 * variant="secondary"    gray outline — edit, view
 * variant="action"       blue — status transitions (approve, publish)
 * variant="warning"      amber — pause, suspend
 * variant="danger"       red filled — destructive confirm (in modals)
 * variant="dangerOutline" red outline — inline delete/remove actions
 * variant="ghost"        subtle — tertiary, low-emphasis
 * variant="icon"         square, icon-only
 *
 * Pass `href` to render a Next.js Link styled as a button.
 */
const AdminButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  function AdminButton({ variant = 'secondary', className, children, ...props }, ref) {
    const classes = cn(adminBtn[variant], className)

    if ('href' in props && props.href !== undefined) {
      const { href, ...rest } = props as AdminLinkProps
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      )
    }

    const { href: _href, ...buttonProps } = props as AdminButtonProps & { href?: undefined }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...buttonProps}
      >
        {children}
      </button>
    )
  }
)

AdminButton.displayName = 'AdminButton'

export { AdminButton }
