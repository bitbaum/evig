"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  X,
  BarChart3,
  Heart,
  ShoppingCart,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShopLogo } from "@/components/shop/ShopLogo";
import { UserMenu } from "@/components/auth/UserMenu";
import {
  MEGA_MENU_COLUMNS,
  SHOP_QUICK_LINKS,
  getCategoryBySlug,
  getCategoryUrl,
} from "@/config/shop";
import { useCart, getCartId } from "@/lib/medusa/hooks";
import { useWishlist, useCompare } from "@/lib/hooks/useShopStore";

interface ShopHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function ShopHeader({
  showBackButton = true,
  backHref = "/shop",
  backLabel = "Zurück zum Shop",
}: ShopHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Cart badge
  const [cartId] = useState(() => getCartId());
  const { data: cart } = useCart(cartId);
  const cartCount = cart?.items?.length ?? 0;

  // Wishlist & compare badges
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();

  // Hide back button on main shop page (/shop/medusa) since we're already there
  const shouldShowBackButton = showBackButton && pathname !== "/shop/medusa";

  return (
    <>
      {/* Skip links for accessibility - only visible on focus */}
      <nav className="sr-only focus-within:not-sr-only" aria-label="Sprunglinks">
        <a
          href="#pageContent"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-emerald-600 text-white px-4 py-2 rounded-lg z-[100] font-medium"
        >
          Zum Hauptinhalt springen
        </a>
        <a
          href="#pageFooter"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-52 bg-emerald-600 text-white px-4 py-2 rounded-lg z-[100] font-medium"
        >
          Zur Fusszeile springen
        </a>
      </nav>

      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Top bar - Back navigation (desktop) */}
        {shouldShowBackButton && (
          <div className="hidden md:block border-b border-gray-100 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-10">
                <Link
                  href={backHref}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backLabel}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main header bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                aria-label="Menü öffnen"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                  isMenuOpen && "bg-gray-100 text-gray-900"
                )}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <Menu className="w-4 h-4" />
                <span>Kategorien</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform",
                    isMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Logo - Icon only on mobile, full logo on desktop */}
              <ShopLogo />
            </div>

            {/* Center: Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Wonach suchst du?"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile search toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                aria-label="Suche"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Compare - hidden on small mobile */}
              <button
                className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label={`Vergleichsliste (${compareCount} Artikel)`}
              >
                <BarChart3 className="w-5 h-5" />
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {compareCount}
                  </span>
                )}
              </button>

              {/* Wishlist - hidden on small mobile */}
              <button
                className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label={`Merkliste (${wishlistCount} Artikel)`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart - always visible */}
              <Link
                href="/shop/medusa/cart"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label={`Warenkorb (${cartCount} Artikel)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Divider - hidden on mobile */}
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              {/* User Menu - RevampIT auth */}
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile search bar (expandable) */}
        {isSearchOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Wonach suchst du?"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Suche schliessen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Category Mega Menu / Mobile Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel - Slide from left on mobile, dropdown on desktop */}
          <div
            className={cn(
              "fixed z-50 bg-white shadow-xl overflow-y-auto",
              // Mobile: slide from left
              "inset-y-0 left-0 w-[85%] max-w-sm",
              // Desktop: dropdown from header
              "lg:inset-auto lg:top-[calc(var(--header-height,6.5rem))] lg:left-0 lg:right-0 lg:w-auto lg:max-w-none lg:max-h-[calc(100vh-8rem)]"
            )}
            style={{ "--header-height": shouldShowBackButton ? "6.5rem" : "4rem" } as React.CSSProperties}
          >
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Kategorien</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Menü schliessen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {MEGA_MENU_COLUMNS.map((column) => (
                  <div key={column.title}>
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                      {column.title}
                    </h3>
                    <ul className="space-y-2">
                      {column.categorySlugs.map((slug) => {
                        const category = getCategoryBySlug(slug);
                        if (!category) return null;
                        return (
                          <li key={slug}>
                            <Link
                              href={getCategoryUrl(slug)}
                              className="text-sm text-gray-600 hover:text-emerald-600 hover:underline transition-colors block py-1"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Zur Shop-Übersicht
                  </Link>
                  {SHOP_QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
