/**
 * Server-safe button className helper.
 *
 * Lets Server Components style native elements like <Link> or <a> with the
 * same look as <Button> without passing the Button component (a Client
 * Component reference) across the RSC boundary via `as={Link}`.
 *
 * Use:
 *   <Link href="/" className={buttonClass({ variant: 'primary' })}>Go</Link>
 *
 * The <Button> component continues to be the right choice for interactive
 * <button> elements; this helper is for anchor-shaped CTAs.
 */
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'outline'
  | 'outline-light'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'destructive-ghost'
  | 'destructive-outline'
  | 'warning'

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const variantClass: Record<ButtonVariant, string> = {
  default: designPrimitive.button.default,
  primary: designPrimitive.button.primary,
  outline: designPrimitive.button.outline,
  'outline-light': designPrimitive.button.outlineLight,
  secondary: designPrimitive.button.secondary,
  ghost: designPrimitive.button.ghost,
  destructive: designPrimitive.button.destructive,
  'destructive-ghost': designPrimitive.button['destructive-ghost'],
  'destructive-outline': designPrimitive.button['destructive-outline'],
  warning: designPrimitive.button.warning,
}

const sizeClass: Record<ButtonSize, string> = {
  default: designPrimitive.buttonSize.default,
  sm: designPrimitive.buttonSize.sm,
  lg: designPrimitive.buttonSize.lg,
  icon: designPrimitive.buttonSize.icon,
}

export function buttonClass(opts: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  const { variant = 'default', size = 'default', className } = opts
  return cn(
    designPrimitive.buttonBase,
    designPrimitive.focus,
    variantClass[variant],
    sizeClass[size],
    className,
  )
}
