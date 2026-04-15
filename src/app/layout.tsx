import type { Viewport } from "next";
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { CSRF_SCRIPT } from "@/lib/auth/csrf";
import "./globals.css";

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Zum Inhalt springen
        </a>
        <script dangerouslySetInnerHTML={{ __html: CSRF_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
