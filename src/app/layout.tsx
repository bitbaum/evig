import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import ConditionalMainLayout from "@/components/layout/ConditionalMainLayout";
import { CSRF_SCRIPT } from "@/lib/auth/csrf";
import "./globals.css";

// Use system fonts to avoid build-time network fetches
const interClassName = "";

export const metadata: Metadata = {
  title: "Revamp-IT",
  description: "Revamp-IT - Nachhaltige Technologielösungen durch Aufarbeitung und Recycling. Helfen Sie mit, Elektroschrott zu reduzieren und Technologie für alle zugänglich zu machen.",
  keywords: ["Elektroschrott", "Recycling", "Aufarbeitung", "nachhaltige Technologie", "Workshops", "Freiwilligenarbeit"],
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
        </Providers>
      </body>
    </html>
  );
}
