import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import ConditionalMainLayout from "@/components/layout/ConditionalMainLayout";
import "./globals.css";

// Use system fonts to avoid build-time network fetches
const interClassName = "";

export const metadata: Metadata = {
  title: "RevampIT",
  description: "RevampIT - Nachhaltige Technologielösungen durch Aufarbeitung und Recycling. Helfen Sie mit, Elektroschrott zu reduzieren und Technologie für alle zugänglich zu machen.",
  keywords: ["Elektroschrott", "Recycling", "Aufarbeitung", "nachhaltige Technologie", "Workshops", "Freiwilligenarbeit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={interClassName}>
        <Providers>
          <ConditionalMainLayout>
            {children}
          </ConditionalMainLayout>
        </Providers>
      </body>
    </html>
  );
}
