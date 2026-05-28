import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { ORG } from "@/config/org";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: ORG.name,
    template: `%s | ${ORG.name}`,
  },
  description: `${ORG.name} - Nachhaltige Technologielösungen durch Aufarbeitung und Recycling. Helfen Sie mit, Elektroschrott zu reduzieren und Technologie für alle zugänglich zu machen.`,
  keywords: ["Elektroschrott", "Recycling", "Aufarbeitung", "nachhaltige Technologie", "Workshops", "Freiwilligenarbeit"],
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
  // to re-render the navbar on hydration mismatch (React error #418).
  const session = await auth();

  return (
    <html lang="de" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans fix-text-rendering antialiased">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
