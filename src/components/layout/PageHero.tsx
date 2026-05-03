import { LucideIcon } from 'lucide-react';
import Heading from '@/components/ui/Heading';
import { DESIGN_TOKENS, ThemeKey } from '@/lib/design/tokens';

interface PageHeroProps {
  theme: ThemeKey;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageHero - Reusable hero section component
 * Enforces consistent design system across all pages
 *
 * @example
 * <PageHero
 *   theme="services"
 *   icon={Wrench}
 *   title="Experten-IT-Dienstleistungen"
 *   subtitle="Nachhaltige Lösungen für Ihre Technologiebedürfnisse"
 * />
 */
export function PageHero({
  theme,
  icon: Icon,
  title,
  subtitle,
  children,
  className = ''
}: PageHeroProps) {
  const gradient = DESIGN_TOKENS.gradients[theme];
  const iconBadge = DESIGN_TOKENS.iconBadges[theme];

  return (
    <div className={`bg-gradient-to-br ${gradient} py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Icon Badge */}
          <div className="flex justify-center mb-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBadge.bg} shadow-sm`}>
              <Icon className={`h-8 w-8 ${iconBadge.text}`} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <Heading level={1} variant="site" className="tracking-tight text-neutral-900">
            {title}
          </Heading>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-6 text-lg sm:text-xl leading-8 text-neutral-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}

          {/* Additional content (buttons, search, etc.) */}
          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
