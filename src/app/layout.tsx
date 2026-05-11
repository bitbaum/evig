import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import { CSRF_SCRIPT } from "@/lib/auth/csrf";
import { ORG } from "@/config/org";
import "./globals.css";

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
      <body className="font-sans fix-text-rendering antialiased">
        <script dangerouslySetInnerHTML={{ __html: CSRF_SCRIPT }} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
