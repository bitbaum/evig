import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Package, Filter } from "lucide-react";
import {
  SHOP_CATEGORIES,
  getCategoryUrl,
  type ShopCategory,
} from "@/config/shop";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const result = findCategoryBySlug(slug);

  if (!result) {
    return {
      title: "Kategorie nicht gefunden | RevampIT Shop",
    };
  }

  const { category, parent } = result;
  const title = parent
    ? `${category.name} - ${parent.name} | RevampIT Shop`
    : `${category.name} | RevampIT Shop`;

  return {
    title,
    description: `Entdecken Sie unsere Auswahl an ${category.name.toLowerCase()} - nachhaltig aufbereitete IT-Geräte bei RevampIT.`,
  };
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
}: {
  category: ShopCategory;
  parent?: ShopCategory;
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
            <span className="sr-only sm:not-sr-only">Start</span>
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <Link href="/shop" className="hover:text-emerald-600 transition-colors">
            Shop
          </Link>
        </li>
        {parent && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <li>
              <Link
                href={getCategoryUrl(parent.slug)}
                className="hover:text-emerald-600 transition-colors"
              >
                {parent.name}
              </Link>
            </li>
          </>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <li>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Subcategory card component
 */
function SubcategoryCard({ category }: { category: ShopCategory }) {
  return (
    <Link
      href={getCategoryUrl(category.slug)}
      className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
            {category.name}
          </h3>
          {category.count !== undefined && (
            <p className="text-sm text-gray-500">{category.count} Produkte</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const result = findCategoryBySlug(slug);

  if (!result) {
    notFound();
  }

  const { category, parent } = result;
  const hasSubcategories = category.children && category.children.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs category={category} parent={parent} />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {category.name}
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Entdecken Sie unsere Auswahl an nachhaltig aufbereiteten{" "}
            {category.name.toLowerCase()} - geprüfte Qualität zu fairen Preisen.
          </p>
          {category.count !== undefined && (
            <p className="mt-4 text-emerald-200">
              {category.count} Produkte in dieser Kategorie
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Subcategories */}
        {hasSubcategories && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Unterkategorien
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.children!.map((sub) => (
                <SubcategoryCard key={sub.slug} category={sub} />
              ))}
            </div>
          </div>
        )}

        {/* Products placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Produkte werden geladen
            </h2>
            <p className="text-gray-600 mb-6">
              Unsere Produktdatenbank wird mit dem Medusa-Backend verbunden.
              Bald finden Sie hier aufbereitete IT-Geräte in der Kategorie{" "}
              <strong>{category.name}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop/medusa"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Zum Online-Shop
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Alle Shop-Optionen
              </Link>
            </div>
          </div>
        </div>

        {/* Related categories */}
        {parent && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Weitere in {parent.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parent.children!
                .filter((c) => c.slug !== category.slug)
                .map((sibling) => (
                  <SubcategoryCard key={sibling.slug} category={sibling} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
