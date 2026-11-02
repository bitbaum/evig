import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

/** The frame every sign-in, sign-up and recovery page shares. */
export function AuthShell({
  backHome,
  title,
  subtitle,
  children,
}: {
  backHome: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-raised px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-action transition-colors hover:text-action"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {backHome}
          </Link>
        </div>
        <div className="mb-8 flex justify-center">
          <Logo showText={true} />
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="card-shell rounded-2xl p-6 sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-semibold leading-tight text-text-primary">
                {title}
              </h1>
              {subtitle && <p className="text-sm text-text-muted sm:text-base">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

/** A same-site path to land on after signing in, or the fallback. */
export function landingPath(candidate: string | undefined, fallback: string): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return fallback;
  if (candidate.startsWith('/\\') || candidate.startsWith('/api/')) return fallback;
  return candidate;
}
