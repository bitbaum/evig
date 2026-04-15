/**
 * AppShell — providers wrapper for non-locale routes (admin, auth, dashboard, profil).
 * html/body live in the root layout (src/app/layout.tsx). This is content-only.
 */
import { Providers } from '@/components/providers/providers'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
