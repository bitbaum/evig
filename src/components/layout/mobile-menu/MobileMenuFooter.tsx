'use client';

// Owns the drawer footer slice: language pills + theme toggle row, and the auth block (user card / login + register).
// Returns a Fragment: the two sibling divs must stay direct children of the Drawer so DOM structure is unchanged.

import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Session } from 'next-auth';
import { Avatar } from '@/components/ui/Avatar';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

export function MobileMenuFooter({
  session,
  t,
  tTheme,
  onClose,
}: {
  session: Session | null;
  t: ReturnType<typeof useTranslations<'nav'>>;
  tTheme: ReturnType<typeof useTranslations<'accessibility.theme'>>;
  onClose: () => void;
}) {
  return (
    <>
      {/* Footer - Language pills (one-tap) + theme toggle + Auth Actions.
          On phones the theme toggle lives here (the top bar hides it below
          sm to keep the scarce header width for account actions). */}
      <div className="border-t border-subtle dark:border-white/6 px-6 pt-3 pb-1 space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-text-tertiary mb-2">{t('language')}</p>
            <LocaleSwitcher inline />
          </div>
          <div className="sm:hidden">
            <p className="text-xs font-medium text-text-tertiary mb-2">{tTheme('label')}</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="px-6 pb-4">
        {session?.user ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-action-muted/8 rounded-xl border border-subtle dark:border-action/20">
              <Avatar
                src={session.user.image}
                name={session.user.name || session.user.email}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {session.user.name || t('defaultUser')}
                </p>
                <p className="text-xs text-action font-medium">{t('loggedIn')}</p>
              </div>
            </div>

            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              onClick={onClose}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-3',
                'text-sm font-medium text-white',
                'bg-action hover:bg-action rounded-xl',
                'transition-colors duration-200',
              )}
            >
              {t('toDashboard')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              href={ROUTES.public.login}
              onClick={onClose}
              className={cn(
                'flex-1 py-3 text-center',
                'text-sm font-medium text-text-secondary',
                'border dark:border-white/10 rounded-xl',
                'hover:bg-surface-raised dark:hover:bg-surface-base/6 hover:text-text-primary transition-colors duration-200',
              )}
            >
              {t('login')}
            </Link>
            <Link
              href={ROUTES.public.register}
              onClick={onClose}
              className={cn(
                'flex-1 py-3 text-center',
                'text-sm font-medium text-white',
                'bg-action rounded-xl',
                'hover:bg-action transition-colors duration-200',
              )}
            >
              {t('register')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
