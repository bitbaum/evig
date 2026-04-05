import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/providers";
import ConditionalMainLayout from "@/components/layout/ConditionalMainLayout";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { CSRF_SCRIPT } from "@/lib/auth/csrf";
import { ORG } from "@/config/org";
import "./globals.css";

// Use system fonts to avoid build-time network fetches
const interClassName = "";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const SITE_TITLE = 'Revamp-IT — Alte Hardware. Neues Leben.'
const SITE_DESCRIPTION = 'Revamp-IT ist ein Schweizer Non-Profit-Verein für nachhaltige Technologie: Aufarbeitung, Reparatur, Open-Source-Lösungen und Workshops. Gemeinsam reduzieren wir Elektroschrott und machen IT für alle zugänglich.'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["Elektroschrott", "Recycling", "Aufarbeitung", "nachhaltige Technologie", "Workshops", "Freiwilligenarbeit"],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: ORG.website,
    siteName: ORG.name,
    locale: 'de_CH',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: ORG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${interClassName} fix-text-rendering`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Zum Inhalt springen
        </a>
        <script dangerouslySetInnerHTML={{ __html: CSRF_SCRIPT }} />
        <Providers>
          <ConditionalMainLayout>
            {children}
          </ConditionalMainLayout>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
