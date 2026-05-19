// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Search, Package, ChevronRight, Home, ArrowLeft, Tag } from "lucide-react";
import Heading from "@/components/ui/Heading";
import {
  SHOP_CATEGORIES,
  POPULAR_SEARCHES,
  getCategoryUrl,
  getSearchUrl,
} from "@/config/shop";
import { ORG } from "@/config/org";
import { getTranslations } from "next-intl/server";
import { getInventoryProducts, type InventoryProduct } from "@/lib/services/inventory-service";
import { ROUTES } from "@/config/routes";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "shop" });

  if (q) {
    const title = t("search.metaTitleWithQuery", { query: q, orgName: ORG.name })
    const description = t("search.metaDescWithQuery", { query: q, orgName: ORG.name })
    return { title, description, openGraph: { title, description, type: 'website' } };
  }

  const title = t("search.metaTitle", { orgName: ORG.name })
  const description = t("search.metaDesc")
  return { title, description, openGraph: { title, description, type: 'website' } };
}

/**
 * Search form component
 */
function SearchForm({
  initialQuery,
  placeholder,
  submitLabel,
}: {
  initialQuery?: string;
  placeholder: string;
  submitLabel: string;
}) {
  return (
    <form action="/shop/search" method="GET" className="max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded-xl focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * Breadcrumbs component
 */
function Breadcrumbs({
  query,
  homeLabel,
  shopLabel,
  searchLabel,
  searchWithQueryLabel,
}: {
  query?: string;
  homeLabel: string;
  shopLabel: string;
  searchLabel: string;
  searchWithQueryLabel: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-neutral-500">
        <li>
          <Link
            href="/"
            className="hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <li>
          <Link href={ROUTES.public.shop} className="hover:text-primary-600 transition-colors">
            {shopLabel}
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <li>
          <span className="text-neutral-900 font-medium">
            {query ? searchWithQueryLabel : searchLabel}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Search results — real inventory products
 */
function SearchResults({
  products,
  total,
  query,
  goToShopLabel,
  allShopOptionsLabel,
  noResultsLabel,
  noResultsHintLabel,
  foundCountLabel,
}: {
  products: InventoryProduct[];
  total: number;
  query: string;
  goToShopLabel: string;
  allShopOptionsLabel: string;
  noResultsLabel: string;
  noResultsHintLabel: string;
  foundCountLabel: string;
}) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <Heading level={2} className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            {noResultsLabel}
          </Heading>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{noResultsHintLabel}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={ROUTES.public.marketplace}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              {goToShopLabel}
            </Link>
            <Link
              href={ROUTES.public.shop}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {allShopOptionsLabel}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{foundCountLabel}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

/**
 * No query state — show suggestions
 */
function NoQueryState({
  popularSearchesLabel,
  browseByCategoryLabel,
  productCountLabel,
  allCategoriesLabel,
}: {
  popularSearchesLabel: string;
  browseByCategoryLabel: string;
  productCountLabel: (count: number) => string;
  allCategoriesLabel: string;
}) {
  return (
    <div className="space-y-8">
      {/* Popular searches */}
      <div>
        <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          {popularSearchesLabel}
        </Heading>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((search) => (
            <Link
              key={search.slug}
              href={getSearchUrl(search.name)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <Search className="w-4 h-4" />
              {search.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by category */}
      <div>
        <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          {browseByCategoryLabel}
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHOP_CATEGORIES.slice(0, 9).map((category) => (
            <Link
              key={category.slug}
              href={getCategoryUrl(category.slug)}
              className="flex items-center gap-3 p-4 card-shell hover:border-primary-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                  {category.name}
                </p>
                {category.count !== undefined && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {productCountLabel(category.count)}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href={ROUTES.public.shop}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {allCategoriesLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q: query } = await searchParams;
  const t = await getTranslations({ locale, namespace: "shop" });

  // Fetch results when query is present
  const searchResult = query
    ? await getInventoryProducts({ limit: 48, offset: 0, search: query }).catch(
        () => ({ products: [], total: 0, limit: 48, offset: 0 })
      )
    : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="bg-primary-700 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs
            query={query}
            homeLabel={t("search.breadcrumbHome")}
            shopLabel={t("search.breadcrumbShop")}
            searchLabel={t("search.breadcrumbSearch")}
            searchWithQueryLabel={query ? t("search.breadcrumbSearchWithQuery", { query }) : ""}
          />
          <Heading level={1} className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            {query ? t("search.heroTitleWithQuery", { query }) : t("search.heroTitle")}
          </Heading>
          <Suspense fallback={<div className="h-16" />}>
            <SearchForm
              initialQuery={query}
              placeholder={t("search.placeholder")}
              submitLabel={t("search.submitButton")}
            />
          </Suspense>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {query && searchResult ? (
          <SearchResults
            products={searchResult.products}
            total={searchResult.total}
            query={query}
            goToShopLabel={t("search.goToShop")}
            allShopOptionsLabel={t("search.allShopOptions")}
            noResultsLabel={t("search.noResultsForQuery", { query })}
            noResultsHintLabel={t("search.noResultsHint")}
            foundCountLabel={t("search.foundCount", { count: searchResult.total })}
          />
        ) : (
          <NoQueryState
            popularSearchesLabel={t("search.popularSearches")}
            browseByCategoryLabel={t("search.browseByCategory")}
            productCountLabel={(count) => t("search.productCount", { count })}
            allCategoriesLabel={t("search.allCategories")}
          />
        )}
      </div>
    </div>
  );
}
