import { Metadata } from "next";

// Force runtime rendering — same React-null SSR bundle issue as OSS detail pages
// (lucide icons in a server component alongside next-auth v5 beta SSR bundles).
export const dynamic = 'force-dynamic'
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
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
 * Generate static params for all categories
 */
export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];

  for (const cat of SHOP_CATEGORIES) {
    slugs.push({ slug: cat.slug });
    if (cat.children) {
      for (const child of cat.children) {
        slugs.push({ slug: child.slug });
      }
    }
  }

  return slugs;
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
          <Link href="/shop" className="hover:text-primary-600 transition-colors">
            {shopLabel}
          </Link>
        </li>
        {parent && (
          <>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
            <li>
              <Link
                href={getCategoryUrl(parent.slug)}
                className="hover:text-primary-600 transition-colors"
              >
                {parent.name}
              </Link>
            </li>
          </>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <li>
          <span className="text-neutral-900 font-medium">{category.name}</span>
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
      className="group block p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <Heading level={3} className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
            {category.name}
          </Heading>
          {category.count !== undefined && (
            <p className="text-sm text-neutral-500">{productCountLabel(category.count)}</p>
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
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs
            category={category}
            parent={parent}
            homeLabel={t("category.breadcrumbHome")}
            shopLabel={t("search.breadcrumbShop")}
          />
          <Heading level={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {category.name}
          </Heading>
          <p className="text-lg text-primary-100 max-w-2xl">
            {t("category.heroSubtitle", { categoryNameLower: category.name.toLowerCase() })}
          </p>
          {category.count !== undefined && (
            <p className="mt-4 text-primary-200">
              {t("category.productCount", { count: category.count })}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Subcategories */}
        {hasSubcategories && (
          <div className="mb-12">
            <Heading level={2} className="text-xl font-semibold text-neutral-900 mb-4">
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
              <Heading level={2} className="text-xl font-semibold text-neutral-900">
                {t("category.categoryProductCount", { count: inventoryResult.total })}
              </Heading>
              <Link
                href="/shop"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('category.showAllProducts', { count: inventoryResult.total })}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8" />
              </div>
              <Heading level={2} className="text-xl font-semibold text-neutral-900 mb-2">
                {t("category.productsLoading")}
              </Heading>
              <p className="text-neutral-600 mb-6">
                {t("category.productsComingSoon", { categoryName: category.name })}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t("category.goToShop")}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {t("category.allShopOptions")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related categories */}
        {parent && (
          <div className="mt-12">
            <Heading level={2} className="text-xl font-semibold text-neutral-900 mb-4">
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
      </div>
    </div>
  );
}
