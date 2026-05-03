import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import ConditionalMainLayout from "@/components/layout/ConditionalMainLayout";
import { CSRF_SCRIPT } from "@/lib/auth/csrf";
import { ORG } from "@/config/org";
import "./globals.css";

// Use system fonts to avoid build-time network fetches
const interClassName = "";

export const metadata: Metadata = {
  title: {
    default: ORG.name,
    template: `%s | ${ORG.name}`,
  },
  description: `${ORG.name} - Nachhaltige Technologielösungen durch Aufarbeitung und Recycling. Helfen Sie mit, Elektroschrott zu reduzieren und Technologie für alle zugänglich zu machen.`,
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
