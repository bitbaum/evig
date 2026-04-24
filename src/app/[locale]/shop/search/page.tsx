import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
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
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <Link
            href="/"
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <Link href="/shop" className="hover:text-emerald-600 transition-colors">
            {shopLabel}
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <span className="text-gray-900 font-medium">
            {query ? searchWithQueryLabel : searchLabel}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Single product card for search results
 */
function ProductCard({ product }: { product: InventoryProduct }) {
  return (
    <Link
      href={`/shop/product/${product.item_uuid}`}
      className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{product.brand}</p>
          <h3 className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-emerald-700">CHF {product.price.toFixed(2)}</span>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {product.condition}
          </span>
        </div>
      </div>
    </Link>
  )
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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <Heading level={2} className="text-xl font-semibold text-gray-900 mb-2">
            {noResultsLabel}
          </Heading>
          <p className="text-gray-600 mb-6">{noResultsHintLabel}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              {goToShopLabel}
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
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
      <p className="text-sm text-gray-500 mb-4">{foundCountLabel}</p>
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
        <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">
          {popularSearchesLabel}
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
          {browseByCategoryLabel}
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
                    {productCountLabel(category.count)}
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-12 sm:py-16">
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
