import { CONTACT } from '@/config/org';
import { cn } from '@/lib/utils';

interface ContactLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
}

export function ContactLink({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: ContactLinkProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-300';

  // Brand accent comes from the design-token SSOT (--color-action), not the
  // raw primary-* scale — so this follows the single per-mode brand green.
  const variants = {
    default: 'bg-action text-action-text hover:bg-action-hover',
    outline: 'bg-transparent border-2 border-action text-action hover:bg-action-muted',
    ghost: 'bg-transparent text-action hover:bg-action-muted',
  };

  const sizes = {
    default: 'px-6 py-3 text-base',
    sm: 'px-4 py-2 text-sm',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <a
      href={`mailto:${CONTACT.email}`}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children || 'Contact Us'}
    </a>
  );
}
