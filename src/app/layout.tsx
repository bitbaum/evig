import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Providers } from "@/components/providers/providers";
import { ORG } from "@/config/org";
import { PUBLIC_SITE_URL } from "@/config/urls";
import { auth } from "@/auth";
// Side-effect import: runs Zod env-var validation at app startup. If any
// required env var is missing, the process throws with a clear listing
// instead of failing later with confusing `undefined` errors deep in
// the auth/db layer. See src/env.ts for the full schema.
import "@/env";
import "./globals.css";

export const metadata: Metadata = {
  // Resolve relative metadata (og:image, canonical) against the real public
  // host — without this, Next infers the internal bind port and emits
  // og:image URLs pointing at localhost, breaking every social preview.
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: ORG.name,
    template: `%s | ${ORG.name}`,
  },
  description: `${ORG.motto} ${ORG.description}`,
  keywords: ["bezahlbare Computer", "kuratierte Hardware", "refurbished Laptops", "Computer-Reparatur", "Linux", "nachhaltige Technik", "Schweiz"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the session server-side and hand it to SessionProvider so the
  // client hydrates with the correct auth state. Without this, every page
  // loaded for a logged-in user briefly flashed (or stuck on) the
  // Anmelden/Registrieren buttons because useSession() started in
  // `status: 'loading'` and the lazy-loaded next-auth import could fail
  // to re-render the navbar on hydration mismatch (React error 418).
  const session = await auth();
  // Resolved by the i18n request config (URL locale → NEXT_LOCALE cookie → de),
  // so <html lang> matches what actually renders — including on cookie-driven
  // routes like /admin and /dashboard.
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans fix-text-rendering antialiased">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
