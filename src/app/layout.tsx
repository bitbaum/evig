import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { ORG } from "@/config/org";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans fix-text-rendering antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
