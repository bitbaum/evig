import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Package, ChevronRight, Home, ArrowLeft } from "lucide-react";
import Heading from "@/components/ui/Heading";
import {
  SHOP_CATEGORIES,
  POPULAR_SEARCHES,
  getCategoryUrl,
  getSearchUrl,
} from "@/config/shop";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;

  if (q) {
    return {
      title: `Suche: "${q}" | RevampIT Shop`,
      description: `Suchergebnisse für "${q}" - nachhaltig aufbereitete IT-Geräte bei RevampIT.`,
    };
  }

  return {
    title: "Suche | RevampIT Shop",
    description:
      "Durchsuche unser Sortiment an nachhaltig aufbereiteten IT-Geräten.",
  };
}

/**
 * Search form component
 */
function SearchForm({ initialQuery }: { initialQuery?: string }) {
  return (
    <form action="/shop/search" method="GET" className="max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Was suchst du? z.B. Laptop, Monitor, Tastatur..."
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Suchen
        </button>
      </div>
    </form>
  );
}

/**
 * Breadcrumbs component
 */
function Breadcrumbs({ query }: { query?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <Link
            href="/"
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">Start</span>
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <Link href="/shop" className="hover:text-emerald-600 transition-colors">
            Shop
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <span className="text-gray-900 font-medium">
            {query ? `Suche: "${query}"` : "Suche"}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Search results component (placeholder for now)
 */
function SearchResults({ query }: { query: string }) {
  // Product search will be connected to the marketplace API

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8" />
        </div>
        <Heading level={2} className="text-xl font-semibold text-gray-900 mb-2">
          Suche nach &quot;{query}&quot;
        </Heading>
        <p className="text-gray-600 mb-6">
          Die Produktsuche wird derzeit eingerichtet. Bald kannst du hier nach
          aufbereiteten IT-Geräten suchen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Zum Online-Shop
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Alle Shop-Optionen
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * No query state - show suggestions
 */
function NoQueryState() {
  return (
    <div className="space-y-8">
      {/* Popular searches */}
      <div>
        <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">
          Beliebte Suchen
        </Heading>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((search) => (
            <Link
              key={search.slug}
              href={getSearchUrl(search.name)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              {search.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by category */}
      <div>
        <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">
          Nach Kategorie stöbern
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHOP_CATEGORIES.slice(0, 9).map((category) => (
            <Link
              key={category.slug}
              href={getCategoryUrl(category.slug)}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                  {category.name}
                </p>
                {category.count !== undefined && (
                  <p className="text-sm text-gray-500">
                    {category.count} Produkte
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/shop"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Alle Kategorien anzeigen →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs query={query} />
          <Heading level={1} className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            {query ? `Ergebnisse für "${query}"` : "Shop durchsuchen"}
          </Heading>
          <Suspense fallback={<div className="h-16" />}>
            <SearchForm initialQuery={query} />
          </Suspense>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {query ? <SearchResults query={query} /> : <NoQueryState />}
      </div>
    </div>
  );
}
