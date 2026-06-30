'use client'

import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef, ElementType, Ref } from 'react'
import { cn } from '@/lib/utils'
import { BUTTONS } from '@/config/ui'
import { designPrimitive } from '@/lib/design-system'
import { Link } from '@/i18n/navigation'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** @deprecated Pass `href` instead — Button renders the link itself. Passing a
   *  component via `as` from a Server Component fails RSC serialization. */
  as?: ElementType
  href?: string
  target?: string
  rel?: string
  variant?: 'default' | 'primary' | 'outline' | 'outline-light' | 'secondary' | 'ghost' | 'destructive' | 'destructive-ghost' | 'destructive-outline' | 'warning'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariantClass = {
  default: BUTTONS.app.default,
  primary: BUTTONS.app.primary,
  outline: BUTTONS.app.outline,
  'outline-light': BUTTONS.app.outlineLight,
  secondary: BUTTONS.app.secondary,
  ghost: BUTTONS.app.ghost,
  destructive: BUTTONS.app.destructive,
  'destructive-ghost': BUTTONS.app['destructive-ghost'],
  'destructive-outline': BUTTONS.app['destructive-outline'],
  warning: BUTTONS.app.warning,
} as const

const buttonSizeClass = {
  default: designPrimitive.buttonSize.default,
  sm: designPrimitive.buttonSize.sm,
  lg: designPrimitive.buttonSize.lg,
  icon: designPrimitive.buttonSize.icon,
} as const

const Button = forwardRef<HTMLElement, ButtonProps>(
  ({ className, as: Tag, href, variant = 'default', size = 'default', ...props }, ref) => {
    const classes = cn(
      designPrimitive.buttonBase,
      designPrimitive.focus,
      buttonVariantClass[variant],
      buttonSizeClass[size],
      className
    )

    // When given an href, Button renders the link element itself. This keeps it
    // usable inside Server Components — passing next-intl's <Link> via the `as`
    // prop there throws "Functions cannot be passed directly to Client Components".
    if (href) {
      const isExternal = /^(https?:|mailto:|tel:)/.test(href) || props.target != null
      // props are typed for a <button>; the anchor/Link branch shares the common
      // attributes (className, onClick, target, rel, children, aria-*) — cast to
      // anchor attrs so the spread type-checks.
      const linkProps = props as unknown as AnchorHTMLAttributes<HTMLAnchorElement>
      return isExternal
        ? <a href={href} className={classes} ref={ref as Ref<HTMLAnchorElement>} {...linkProps} />
        : <Link href={href} className={classes} ref={ref as Ref<HTMLAnchorElement>} {...linkProps} />
    }

    const Tag2: ElementType = Tag ?? 'button'
    return <Tag2 className={classes} ref={ref} {...props} />
  }
)

Button.displayName = 'Button'

export { Button } 
