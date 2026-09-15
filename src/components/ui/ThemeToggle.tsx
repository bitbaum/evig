'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/useMounted';

interface ThemeToggleProps {
  className?: string;
}

const OPTIONS = [
  { value: 'light', icon: Sun, key: 'light' as const },
  { value: 'system', icon: Monitor, key: 'system' as const },
  { value: 'dark', icon: Moon, key: 'dark' as const },
] as const;

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('accessibility.theme');
  // The resolved theme is only knowable in the browser; render the neutral
  // icon until then so server and first client render agree.
  const mounted = useMounted();
  const current = mounted ? (theme ?? 'system') : 'system';
  const option = OPTIONS.find((item) => item.value === current) ?? OPTIONS[1];
  const Icon = option.icon;
  const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';

  return (
    <button
      type="button"
      aria-label={`${t('label')}: ${t(option.key)}`}
      title={`${t('label')}: ${t(option.key)}`}
      onClick={() => setTheme(next)}
      suppressHydrationWarning
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-surface-raised text-text-tertiary transition-colors hover:border-strong hover:text-text-primary',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
