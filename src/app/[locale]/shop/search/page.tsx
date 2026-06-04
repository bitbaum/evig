// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { Search, Package, ChevronRight, Home, ArrowLeft, Tag } from "lucide-react";
import Heading from "@/components/ui/Heading";
import { Input } from "@/components/ui/input";
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
import { PageShell } from "@/components/layout/PageShell";

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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <Input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder={placeholder}
          className="pl-12 pr-4 py-4 text-lg"
          autoFocus
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5"
        >
          {submitLabel}
        </Button>
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
      <ol className="flex items-center gap-2 text-sm text-text-tertiary">
        <li>
          <Link
            href="/"
            className="hover:text-action transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-text-muted" />
        <li>
          <Link href={ROUTES.public.shop} className="hover:text-action transition-colors">
            {shopLabel}
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-text-muted" />
        <li>
          <span className="text-text-primary font-medium">
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
      <div className="card-shell p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-action-muted-muted text-action flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <Heading level={2} className="text-xl font-semibold text-text-primary mb-2">
            {noResultsLabel}
          </Heading>
          <p className="text-text-secondary mb-6">{noResultsHintLabel}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={ROUTES.public.marketplace} className={buttonClass({ variant: 'primary', size: 'lg' })}>
              <Package className="w-5 h-5" />
              {goToShopLabel}
            </Link>
            <Link href={ROUTES.public.shop} className={buttonClass({ variant: 'outline', size: 'lg' })}>
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
      <p className="text-sm text-text-tertiary mb-4">{foundCountLabel}</p>
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
        <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">
          {popularSearchesLabel}
        </Heading>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((search) => (
            <Link
              key={search.slug}
              href={getSearchUrl(search.name)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-base border rounded-full text-sm font-medium text-text-secondary hover:bg-action-muted-muted hover:border-strong dark:hover:border-action hover:text-action transition-colors"
            >
              <Search className="w-4 h-4" />
              {search.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by category */}
      <div>
        <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">
          {browseByCategoryLabel}
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHOP_CATEGORIES.slice(0, 9).map((category) => (
            <Link
              key={category.slug}
              href={getCategoryUrl(category.slug)}
              className="flex items-center gap-3 p-4 card-shell hover:border-strong transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-raised text-text-secondary flex items-center justify-center group-hover:bg-action-muted dark:group-hover:bg-action-muted group-hover:text-action transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate group-hover:text-action transition-colors">
                  {category.name}
                </p>
                {category.count !== undefined && (
                  <p className="text-sm text-text-tertiary">
                    {productCountLabel(category.count)}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted dark:text-text-secondary group-hover:text-action transition-colors" />
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href={ROUTES.public.shop}
            className="text-action hover:text-action font-medium"
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
    <>
      {/* Hero Section */}
      <section className="bg-action text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      <PageShell py="py-8 sm:py-12">
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
      </PageShell>
    </>
  );
}
