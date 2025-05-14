import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NextProvider } from "@/components/providers/NextProvider";
import MainLayout from "@/components/layout/MainLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevampIT",
  description: "RevampIT - Sustainable technology solutions through refurbishment and recycling. Join us in reducing electronic waste and making technology accessible to everyone.",
  keywords: ["electronic waste", "recycling", "refurbishment", "sustainable technology", "workshops", "volunteer"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <NextProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </NextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
