// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles.
// Must be before any import so Turbopack's static analysis picks it up.
export const dynamic = 'force-dynamic'

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { buttonClass } from "@/components/ui/button-class";
import { ChevronRight, Home, Package, ShoppingCart, Tag } from "lucide-react";
import Heading from "@/components/ui/Heading";
import {
  SHOP_CATEGORIES,
  getCategoryUrl,
  type ShopCategory,
} from "@/config/shop";
import { ORG } from "@/config/org";
import { getTranslations } from "next-intl/server";
import { getInventoryProducts, type InventoryProduct } from "@/lib/services/inventory-service";
import { ROUTES } from "@/config/routes";
import { PageShell } from "@/components/layout/PageShell";

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Find a category by slug (searches nested children too)
 */
function findCategoryBySlug(
  slug: string,
  categories: ShopCategory[] = SHOP_CATEGORIES
): { category: ShopCategory; parent?: ShopCategory } | null {
  for (const cat of categories) {
    if (cat.slug === slug) {
      return { category: cat };
    }
    if (cat.children) {
      for (const child of cat.children) {
        if (child.slug === slug) {
          return { category: child, parent: cat };
        }
      }
    }
  }
  return null;
}

/**
 * Generate metadata for the category page
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  const result = findCategoryBySlug(slug);

  if (!result) {
    return {
      title: t("category.notFoundMeta", { orgName: ORG.name }),
    };
  }

  const { category, parent } = result;
  const title = parent
    ? t("category.metaTitleWithParent", {
        categoryName: category.name,
        parentName: parent.name,
        orgName: ORG.name,
      })
    : t("category.metaTitle", { categoryName: category.name, orgName: ORG.name });

  const description = t("category.metaDesc", {
    categoryNameLower: category.name.toLowerCase(),
    orgName: ORG.name,
  })
  return { title, description, openGraph: { title, description, type: 'website' } };
}


/**
 * Breadcrumb component
 */
function Breadcrumbs({
  category,
  parent,
  homeLabel,
  shopLabel,
}: {
  category: ShopCategory;
  parent?: ShopCategory;
  homeLabel: string;
  shopLabel: string;
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
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <li>
          <Link href={ROUTES.public.shop} className="hover:text-action transition-colors">
            {shopLabel}
          </Link>
        </li>
        {parent && (
          <>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
            <li>
              <Link
                href={getCategoryUrl(parent.slug)}
                className="hover:text-action transition-colors"
              >
                {parent.name}
              </Link>
            </li>
          </>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <li>
          <span className="text-text-primary font-medium">{category.name}</span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Subcategory card component
 */
function SubcategoryCard({
  category,
  productCountLabel,
}: {
  category: ShopCategory;
  productCountLabel: (count: number) => string;
}) {
  return (
    <Link
      href={getCategoryUrl(category.slug)}
      className="group block p-4 card-shell hover:border-strong transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-action-muted-muted text-action flex items-center justify-center group-hover:bg-action group-hover:text-white transition-colors">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <Heading level={3} className="font-medium text-text-primary group-hover:text-action transition-colors">
            {category.name}
          </Heading>
          {category.count !== undefined && (
            <p className="text-sm text-text-tertiary">{productCountLabel(category.count)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  const result = findCategoryBySlug(slug);

  if (!result) {
    notFound();
  }

  const { category, parent } = result;
  const hasSubcategories = category.children && category.children.length > 0;

  // Fetch real products for this category
  const inventoryResult = await getInventoryProducts({
    limit: 24,
    offset: 0,
    category: category.name,
  }).catch(() => ({ products: [], total: 0, limit: 24, offset: 0 }))

  return (
    <>
      {/* Hero Section */}
      <section className="bg-action text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            category={category}
            parent={parent}
            homeLabel={t("category.breadcrumbHome")}
            shopLabel={t("search.breadcrumbShop")}
          />
          <Heading level={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {category.name}
          </Heading>
          <p className="text-lg text-action-text max-w-2xl">
            {t("category.heroSubtitle", { categoryNameLower: category.name.toLowerCase() })}
          </p>
          {category.count !== undefined && (
            <p className="mt-4 text-action-text">
              {t("category.productCount", { count: category.count })}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <PageShell py="py-8 sm:py-12">
        {/* Subcategories */}
        {hasSubcategories && (
          <div className="mb-12">
            <Heading level={2} className="text-xl font-semibold text-text-primary mb-4">
              {t("category.subcategories")}
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.children!.map((sub) => (
                <SubcategoryCard
                  key={sub.slug}
                  category={sub}
                  productCountLabel={(count) => t("category.categoryProductCount", { count })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {inventoryResult.products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <Heading level={2} className="text-xl font-semibold text-text-primary">
                {t("category.categoryProductCount", { count: inventoryResult.total })}
              </Heading>
              <Link
                href={ROUTES.public.shop}
                className="text-sm text-action hover:text-action font-medium flex items-center gap-1"
              >
                {t("category.allShopOptions")}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventoryResult.products.map((product) => (
                <ProductCard key={product.id} product={product} stockOneLabel={t('product.stockOne')} />
              ))}
            </div>
            {inventoryResult.total > inventoryResult.products.length && (
              <div className="text-center mt-8">
                <Link
                  href={`/shop?category=${encodeURIComponent(category.name)}`}
                  className={buttonClass({ variant: 'primary', size: 'lg' })}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('category.showAllProducts', { count: inventoryResult.total })}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="card-shell p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-action-muted-muted text-action flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8" />
              </div>
              <Heading level={2} className="text-xl font-semibold text-text-primary mb-2">
                {t("category.productsLoading")}
              </Heading>
              <p className="text-text-secondary mb-6">
                {t("category.productsComingSoon", { categoryName: category.name })}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={ROUTES.public.marketplace} className={buttonClass({ variant: 'primary', size: 'lg' })}>
                  {t("category.goToShop")}
                </Link>
                <Link href={ROUTES.public.shop} className={buttonClass({ variant: 'outline', size: 'lg' })}>
                  {t("category.allShopOptions")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related categories */}
        {parent && (
          <div className="mt-12">
            <Heading level={2} className="text-xl font-semibold text-text-primary mb-4">
              {t("category.relatedIn", { parentName: parent.name })}
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parent.children!
                .filter((c) => c.slug !== category.slug)
                .map((sibling) => (
                  <SubcategoryCard
                    key={sibling.slug}
                    category={sibling}
                    productCountLabel={(count) => t("category.categoryProductCount", { count })}
                  />
                ))}
            </div>
          </div>
        )}
      </PageShell>
    </>
  );
}
