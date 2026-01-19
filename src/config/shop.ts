/**
 * Shop configuration
 *
 * Single Source of Truth for shop categories and related config
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export interface ShopCategory {
  name: string;
  slug: string;
  count?: number;
  children?: ShopCategory[];
}

export interface PopularSearch {
  name: string;
  slug: string;
}

export interface QuickLink {
  name: string;
  href: string;
}

/**
 * Generate shop category URL from slug
 */
export function getCategoryUrl(slug: string): string {
  return `/shop/category/${slug}`;
}

/**
 * Generate search URL from query
 */
export function getSearchUrl(query: string): string {
  return `/shop/search?q=${encodeURIComponent(query)}`;
}

/**
 * Product categories for the shop sidebar
 * Counts are placeholder values - in production these should come from the database
 */
export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    name: "Computer und Komplettsysteme",
    slug: "computer-komplettsysteme",
    count: 24,
    children: [
      { name: "Desktop PCs", slug: "desktop-pcs" },
      { name: "Mini PCs", slug: "mini-pcs" },
    ],
  },
  {
    name: "Laptop und Zubehör",
    slug: "laptop-zubehoer",
    count: 18,
    children: [
      { name: "Business Laptops", slug: "business-laptops" },
      { name: "Dockingstations", slug: "dockingstations" },
    ],
  },
  {
    name: "Drucker, Fax, Scanner",
    slug: "drucker-fax-scanner",
    count: 12,
  },
  {
    name: "Monitor, Beamer, Kamera",
    slug: "monitor-beamer-kamera",
    count: 31,
  },
  {
    name: "Tastatur, Maus, Eingabegeräte",
    slug: "tastatur-maus-eingabegeraete",
    count: 45,
  },
  {
    name: "Mainboard, CPU, Ram",
    slug: "mainboard-cpu-ram",
    count: 28,
  },
  {
    name: "Steckkarten",
    slug: "steckkarten",
    count: 15,
  },
  {
    name: "Gehäuse, Netzteile, USB-Hubs",
    slug: "gehaeuse-netzteile-usb-hubs",
    count: 22,
  },
  {
    name: "Festplatten, SSDs, Sticks",
    slug: "festplatten-ssds-sticks",
    count: 38,
  },
  {
    name: "Laufwerke für Medien",
    slug: "laufwerke-medien",
    count: 8,
  },
  {
    name: "Externe Netzwerkgeräte",
    slug: "externe-netzwerkgeraete",
    count: 19,
  },
  {
    name: "Soundgeräte, Multimedia",
    slug: "soundgeraete-multimedia",
    count: 14,
  },
  {
    name: "Kabel, Adapter, Montage",
    slug: "kabel-adapter-montage",
    count: 56,
  },
  {
    name: "Gutscheine",
    slug: "gutscheine",
    count: 3,
  },
];

/**
 * Popular search terms shown as quick-access chips
 */
export const POPULAR_SEARCHES: PopularSearch[] = [
  { name: "USB Kabel", slug: "usb-kabel" },
  { name: "Smartphone", slug: "smartphone" },
  { name: "Netzwerkkabel", slug: "netzwerkkabel" },
  { name: "Kopfhörer", slug: "kopfhoerer" },
  { name: "Monitor", slug: "monitor" },
  { name: "Maus", slug: "maus" },
  { name: "Tastatur", slug: "tastatur" },
];

/**
 * Quick links in the sidebar footer
 */
export const SHOP_QUICK_LINKS: QuickLink[] = [
  { name: "Produkte verkaufen", href: "/marketplace/sell" },
  { name: "Gutscheine", href: "/shop/category/gutscheine" },
];

/**
 * Mega menu configuration for ShopHeader
 * Groups categories into columns for the dropdown menu
 */
export interface MegaMenuColumn {
  title: string;
  categorySlugs: string[];
}

/**
 * Helper to get category by slug
 */
export function getCategoryBySlug(slug: string): ShopCategory | undefined {
  return SHOP_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Mega menu columns - references SHOP_CATEGORIES by slug
 * This allows the mega menu to display grouped categories while
 * maintaining SSOT with the main SHOP_CATEGORIES array
 */
export const MEGA_MENU_COLUMNS: MegaMenuColumn[] = [
  {
    title: "Computer & IT",
    categorySlugs: [
      "computer-komplettsysteme",
      "laptop-zubehoer",
      "drucker-fax-scanner",
      "monitor-beamer-kamera",
      "tastatur-maus-eingabegeraete",
      "mainboard-cpu-ram",
    ],
  },
  {
    title: "Komponenten",
    categorySlugs: [
      "steckkarten",
      "gehaeuse-netzteile-usb-hubs",
      "festplatten-ssds-sticks",
      "laufwerke-medien",
      "externe-netzwerkgeraete",
    ],
  },
  {
    title: "Multimedia & Zubehör",
    categorySlugs: [
      "soundgeraete-multimedia",
      "kabel-adapter-montage",
    ],
  },
  {
    title: "Sonstiges",
    categorySlugs: [
      "gutscheine",
    ],
  },
];
