"use client";

import React, { useState } from "react";
import { ChevronRight, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryItem {
  name: string;
  href?: string;
  count?: number;
  children?: CategoryItem[];
}

const categories: CategoryItem[] = [
  {
    name: "Computer und Komplettsysteme",
    href: "#",
    count: 24,
    children: [{ name: "Desktop PCs", href: "#" }, { name: "Mini PCs", href: "#" }],
  },
  {
    name: "Laptop und Zubehör",
    href: "#",
    count: 18,
    children: [{ name: "Business Laptops", href: "#" }, { name: "Dockingstations", href: "#" }],
  },
  {
    name: "Drucker, Fax, Scanner",
    href: "#",
    count: 12,
  },
  {
    name: "Monitor, Beamer, Kamera",
    href: "#",
    count: 31,
  },
  {
    name: "Tastatur, Maus, Eingabegeräte",
    href: "#",
    count: 45,
  },
  {
    name: "Mainboard, CPU, Ram",
    href: "#",
    count: 28,
  },
  {
    name: "Steckkarten",
    href: "#",
    count: 15,
  },
  {
    name: "Gehäuse, Netzteile, USB-Hubs",
    href: "#",
    count: 22,
  },
  {
    name: "Festplatten, SSDs, Sticks",
    href: "#",
    count: 38,
  },
  {
    name: "Laufwerke für Medien",
    href: "#",
    count: 8,
  },
  {
    name: "Externe Netzwerkgeräte",
    href: "#",
    count: 19,
  },
  {
    name: "Soundgeräte, Multimedia",
    href: "#",
    count: 14,
  },
  {
    name: "Kabel, Adapter, Montage",
    href: "#",
    count: 56,
  },
  {
    name: "Gutscheine",
    href: "#",
    count: 3,
  },
];

const topCategories = [
  "USB Kabel",
  "Smartphone",
  "Netzwerkkabel",
  "Kopfhörer",
  "Monitor",
  "Maus",
  "Tastatur",
];

// Single category item component
function CategoryTreeItem({ category }: { category: CategoryItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <li>
      <button
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 text-left text-sm rounded-lg transition-colors",
          "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        )}
      >
        <span className="truncate flex-1">{category.name}</span>
        {category.count && (
          <span className="text-xs text-gray-400 mr-2">{category.count}</span>
        )}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        )}
      </button>

      {hasChildren && isExpanded && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2">
          {category.children!.map((child, index) => (
            <li key={child.name + index}>
              <a
                href={child.href}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {child.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface ShopSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ShopSidebar({ isOpen, onClose, className }: ShopSidebarProps) {
  const sidebarContent = (
    <div className="p-4 lg:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategorien</h2>

      <nav aria-label="Produktkategorien">
        <ul className="space-y-1">
          {categories.map((category, index) => (
            <CategoryTreeItem key={category.name + index} category={category} />
          ))}
        </ul>
      </nav>

      {/* Top categories */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Beliebte Suchen</h3>
        <div className="flex flex-wrap gap-2">
          {topCategories.map((category) => (
            <a
              key={category}
              href="#"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 rounded-full transition-colors"
            >
              {category}
            </a>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Direkt zu</h3>
        <div className="space-y-2">
          <a
            href="#"
            className="block px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Produkte verkaufen
          </a>
          <a
            href="#"
            className="block px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Gutscheine
          </a>
        </div>
      </div>
    </div>
  );

  // Mobile drawer mode - only render when isOpen is explicitly passed
  if (typeof isOpen !== "undefined") {
    if (!isOpen) return null; // Don't render anything when closed

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-xl overflow-y-auto lg:hidden animate-in slide-in-from-left duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter & Kategorien</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Schliessen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop static sidebar
  return (
    <aside
      className={cn(
        "hidden lg:block w-72 xl:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0",
        className
      )}
    >
      {sidebarContent}
    </aside>
  );
}

// Filter button for mobile - to be used in the main page
export function MobileFilterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      <Filter className="w-4 h-4" />
      <span>Filter</span>
    </button>
  );
}
