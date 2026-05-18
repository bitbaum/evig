import { CONTACT } from '@/config/org'
import { cn } from '@/lib/utils'

interface ContactLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  children?: React.ReactNode
}

export function ContactLink({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: ContactLinkProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-300'
  
  const variants = {
    default: 'bg-primary-600 text-white hover:bg-primary-700',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
  }

  const sizes = {
    default: 'px-6 py-3 text-base',
    sm: 'px-4 py-2 text-sm',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <a
      href={`mailto:${CONTACT.email}`}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children || 'Contact Us'}
    </a>
  )
} 