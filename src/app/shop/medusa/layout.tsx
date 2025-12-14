"use client";

import { ReactNode } from "react";
import { RevampCopilot, SuggestionButton } from "@/features/floating-ui";
import Footer from "@/components/layout/Footer";
import { ShopHeader } from "@/components/shop/ShopHeader";

interface ShopLayoutProps {
  children: ReactNode;
}

/**
 * RevampIT Shop Layout
 * 
 * Provides a dedicated layout for the RevampIT e-commerce section.
 * Includes the shop-specific header with mobile-friendly logo,
 * plus footer and floating UI elements for consistency.
 * 
 * Authentication is handled through the RevampIT auth system (NextAuth).
 * Backend powered by Medusa.js for headless commerce.
 */
export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Shop Header */}
      <ShopHeader />
      
      {/* Main content area */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <Footer />

      {/* AI Navigation Assistant - Bottom Right */}
      <RevampCopilot />

      {/* Comprehensive Page Improvement Suggestions - Right Side */}
      <SuggestionButton />
    </div>
  );
}
