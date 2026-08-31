'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import MainLayout from './MainLayout';

interface ConditionalMainLayoutProps {
  children: ReactNode;
  /** Hide floating assistants on focused task surfaces (dashboard, checkout). */
  leanChrome?: boolean;
}

export default function ConditionalMainLayout({
  children,
  leanChrome = false,
}: ConditionalMainLayoutProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  if (pathname?.startsWith('/auth')) {
    return <>{children}</>;
  }

  // The /vision manifesto is full-bleed with its own header/footer — opt it out
  // of the standard chrome. usePathname() keeps the locale prefix for non-default
  // locales (/en/vision …), so normalise it away before matching.
  const normalized = (pathname ?? '').replace(/^\/(en|fr|it|es|ja|ko|ru)(?=\/|$)/, '') || '/';
  if (normalized === '/vision') {
    return <>{children}</>;
  }

  return <MainLayout leanChrome={leanChrome}>{children}</MainLayout>;
}
