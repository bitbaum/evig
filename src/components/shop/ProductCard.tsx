"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Heart, ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  images?: Array<{
    id: string;
    url: string;
  }>;
  variants?: Array<{
    id: string;
    title: string;
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
    inventory_quantity?: number;
  }>;
  collection?: {
    title: string;
  };
  tags?: Array<{
    value: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  // Get price from variants (Medusa structure) - prefer CHF, fallback to EUR or USD
  const prices = product.variants?.[0]?.prices;
  const chfPrice = prices?.find((p) => p.currency_code === "chf");
  const eurPrice = prices?.find((p) => p.currency_code === "eur");
  const usdPrice = prices?.find((p) => p.currency_code === "usd");
  const price = chfPrice || eurPrice || usdPrice;

  const formattedPrice = price
    ? new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: price.currency_code.toUpperCase(),
      }).format(price.amount / 100)
    : "Preis auf Anfrage";

  // Get image from product (prefer thumbnail, fallback to first image)
  const imageUrl = product.thumbnail || product.images?.[0]?.url;

  // Availability and metadata
  const inventoryQuantity = product.variants?.[0]?.inventory_quantity ?? 0;
  const isAvailable = inventoryQuantity > 0;
  const productType = product.collection?.title || "Produkt";
  const rating = 4.5; // Mock rating
  // Generate consistent "random" review count based on product ID for SSR compatibility
  const reviewCount = (parseInt(product.id.replace(/\D/g, "")) % 41) + 10;

  // Split title into brand and product name
  const titleParts = product.title.split(" ");
  const brandPart = titleParts[0];
  const productName = titleParts.slice(1).join(" ") || product.title;

  const isCompact = variant === "compact";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group h-full"
    >
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col">
        <Link
          href={`/shop/medusa/products/${product.handle}`}
          className="block flex-1 flex flex-col"
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <svg
                  className="h-12 w-12 sm:h-16 sm:w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Product Type Badge */}
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-white/95 text-gray-700 rounded shadow-sm">
                {productType}
              </span>
            </div>

            {/* Availability Status */}
            <div className="absolute top-2 right-2">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded shadow-sm",
                  isAvailable
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {isAvailable ? "verfügbar" : "nicht verfügbar"}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className={cn("p-3 sm:p-4 flex-1 flex flex-col", isCompact && "p-2 sm:p-3")}>
            {/* Price */}
            <div className="mb-1.5 sm:mb-2">
              <span className={cn(
                "font-bold text-gray-900",
                isCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              )}>
                {formattedPrice}
              </span>
            </div>

            {/* Brand and Title */}
            <div className="mb-1.5 sm:mb-2">
              <h3 className={cn(
                "line-clamp-2",
                isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
              )}>
                <span className="font-semibold text-gray-900">{brandPart}</span>
                <span className="text-gray-700"> {productName}</span>
              </h3>
            </div>

            {/* Description - hidden on compact/mobile */}
            {!isCompact && product.description && (
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 line-clamp-2 mb-2 flex-1">
                {product.description}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1 mt-auto">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-3 h-3 sm:w-4 sm:h-4",
                      star <= Math.floor(rating)
                        ? "text-amber-400 fill-current"
                        : star <= rating
                        ? "text-amber-400 fill-current opacity-50"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">
                {reviewCount}
              </span>
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div
          className={cn(
            "px-3 pb-3 sm:px-4 sm:pb-4 flex items-center justify-between gap-1",
            isCompact && "px-2 pb-2 sm:px-3 sm:pb-3"
          )}
        >
          <button
            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Zur Vergleichsliste hinzufügen"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Zur Merkliste hinzufügen"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            className={cn(
              "p-1.5 sm:p-2 rounded-lg transition-colors",
              isAvailable
                ? "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                : "text-gray-300 cursor-not-allowed"
            )}
            aria-label="In den Warenkorb"
            disabled={!isAvailable}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
