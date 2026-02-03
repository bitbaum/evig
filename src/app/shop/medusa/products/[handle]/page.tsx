"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Check, Heart, BarChart3, Truck, Shield, RefreshCw, Leaf, Star, Loader2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProduct, useAddToCart, useCreateCart, getCartId, useRegions } from "@/lib/medusa/hooks";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Inventory product type
interface InventoryProductDetail {
  id: string
  item_uuid: string
  title: string
  brand: string
  model: string
  description: string | null
  specifications: Record<string, string>
  price: number
  condition: string
  dimensions: { laenge_mm?: number; breite_mm?: number; hoehe_mm?: number } | null
  weight_grams: number | null
  category: string | null
  subcategory: string | null
  quantity: number
  is_available: boolean
  images: Array<{ id: string; url: string; is_primary: boolean }>
  customer_profiles: Array<{ slug: string; name_de: string; color: string; description_de: string }>
}

// Check if ID looks like a UUID
function isUUID(id: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(id)
}

// Custom hook for inventory products
function useInventoryProduct(id: string) {
  const [data, setData] = useState<InventoryProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/shop/inventory/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const result = await response.json()
        // API returns { success: true, data: { product: {...} } }
        if (result.success && result.data?.product) {
          setData(result.data.product)
        } else {
          throw new Error(result.error || 'Product not found')
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id && isUUID(id)) {
      fetchProduct()
    }
  }, [id])

  return { data, isLoading: isUUID(id) ? isLoading : false, error }
}

// Condition labels
const CONDITION_LABELS: Record<string, string> = {
  new: 'Neu',
  like_new: 'Wie neu',
  good: 'Gut',
  fair: 'Akzeptabel',
  poor: 'Gebraucht',
}

export default function ProductPage() {
  const params = useParams();
  const handle = params.handle as string;

  // Check if this is an inventory product (UUID) or Medusa product (handle)
  const isInventoryProduct = isUUID(handle)

  // Fetch from appropriate source
  const { data: medusaProduct, isLoading: medusaLoading, error: medusaError } = useProduct(isInventoryProduct ? '' : handle);
  const { data: inventoryProduct, isLoading: inventoryLoading, error: inventoryError } = useInventoryProduct(handle)

  const isLoading = isInventoryProduct ? inventoryLoading : medusaLoading
  const error = isInventoryProduct ? inventoryError : medusaError
  const product = isInventoryProduct ? inventoryProduct : medusaProduct
  const { data: regions } = useRegions();
  const addToCart = useAddToCart();
  const createCart = useCreateCart();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Get default region for cart creation
  const defaultRegion = regions?.[0];

  const handleAddToCart = async () => {
    // For inventory products, we don't use Medusa cart
    if (isInventoryProduct) {
      // For now, show a contact message - can implement inventory cart later
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
      return;
    }

    if (!medusaProduct || !medusaProduct.variants?.[0]) return;

    try {
      let cartId = getCartId();

      // Create cart if it doesn't exist
      if (!cartId) {
        const newCart = await createCart.mutateAsync(defaultRegion?.id);
        cartId = newCart.id;
      }

      // Add to cart
      await addToCart.mutateAsync({
        cartId: cartId!,
        variantId: medusaProduct.variants[0].id,
        quantity,
      });

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      logger.error("Failed to add to cart", { error: err });
    }
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              <div className="aspect-square bg-gray-200 rounded-xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 w-32 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or product not found
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            href="/shop/medusa"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Shop
          </Link>
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produkt nicht gefunden</h2>
            <p className="text-gray-600 mb-6">Das gewünschte Produkt existiert leider nicht.</p>
            <Link
              href="/shop/medusa"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Zurück zum Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle both inventory and Medusa products
  let formattedPrice: string
  let isAvailable: boolean
  let category: string
  let allImages: Array<{ id: string; url: string }>
  let productTitle: string
  let productDescription: string | null
  let hasOptions: boolean
  let specs: Record<string, string> | null = null
  let customerProfiles: Array<{ slug: string; name_de: string; color: string; description_de: string }> = []
  let condition: string | null = null

  if (isInventoryProduct && inventoryProduct) {
    // Inventory product
    formattedPrice = `CHF ${Number(inventoryProduct.price).toFixed(2)}`
    isAvailable = inventoryProduct.is_available
    category = inventoryProduct.category || 'Produkt'
    productTitle = inventoryProduct.title
    productDescription = inventoryProduct.description
    hasOptions = false
    specs = inventoryProduct.specifications
    customerProfiles = inventoryProduct.customer_profiles
    condition = inventoryProduct.condition
    allImages = inventoryProduct.images.length > 0
      ? inventoryProduct.images
      : [{ id: 'placeholder', url: '' }]
  } else if (medusaProduct) {
    // Medusa product
    const prices = medusaProduct.variants?.[0]?.prices;
    const chfPrice = prices?.find((p) => p.currency_code === "chf");
    const eurPrice = prices?.find((p) => p.currency_code === "eur");
    const price = chfPrice || eurPrice || prices?.[0];

    formattedPrice = price
      ? new Intl.NumberFormat("de-CH", {
          style: "currency",
          currency: price.currency_code.toUpperCase(),
        }).format(price.amount / 100)
      : "Preis auf Anfrage";

    isAvailable = (medusaProduct.variants?.[0]?.inventory_quantity ?? 0) > 0 || medusaProduct.variants?.[0]?.allow_backorder || false;
    category = medusaProduct.collection?.title || "Produkt";
    productTitle = medusaProduct.title
    productDescription = medusaProduct.description || null
    hasOptions = medusaProduct.options && medusaProduct.options.length > 0;
    allImages = [
      ...(medusaProduct.thumbnail ? [{ id: "thumb", url: medusaProduct.thumbnail }] : []),
      ...(medusaProduct.images || [])
    ].filter((img, index, self) =>
      index === self.findIndex((t) => t.url === img.url)
    );
  } else {
    // Fallback
    formattedPrice = 'Preis auf Anfrage'
    isAvailable = false
    category = 'Produkt'
    productTitle = 'Produkt'
    productDescription = null
    hasOptions = false
    allImages = []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back link */}
        <Link
          href="/shop/medusa"
          className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images */}
          <div className="relative space-y-4">
            {/* Main Image */}
            <motion.div 
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
            >
              {allImages[selectedImage]?.url ? (
                <Image
                  src={allImages[selectedImage].url}
                  alt={productTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                      selectedImage === index 
                        ? "border-emerald-600 ring-2 ring-emerald-200" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={`${productTitle} Bild ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white/95 text-gray-700 rounded-full shadow-sm">
                {category}
              </span>
            </div>

            {/* Quick actions on image */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                className="p-2.5 bg-white/95 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm transition-colors"
                aria-label="Zur Merkliste hinzufügen"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                className="p-2.5 bg-white/95 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow-sm transition-colors"
                aria-label="Zur Vergleichsliste hinzufügen"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {productTitle}
            </h1>

            {/* Condition badge for inventory products */}
            {condition && (
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                  Zustand: {CONDITION_LABELS[condition] || condition}
                </span>
              </div>
            )}

            {/* Customer Profiles for inventory products */}
            {customerProfiles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Empfohlen für:</p>
                <div className="flex flex-wrap gap-2">
                  {customerProfiles.map((profile) => (
                    <span
                      key={profile.slug}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white rounded-full"
                      style={{ backgroundColor: profile.color }}
                      title={profile.description_de}
                    >
                      {profile.name_de}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-4 h-4",
                      star <= 4 ? "text-amber-400 fill-current" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">(4.0)</span>
            </div>

            {/* Availability badge */}
            <div className="mb-4">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 text-sm font-medium rounded-full",
                  isAvailable
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {isAvailable ? "✓ Verfügbar" : "Nicht verfügbar"}
              </span>
            </div>

            {/* Price */}
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              {formattedPrice}
            </p>

            {/* Description */}
            {productDescription && (
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">{productDescription}</p>
              </div>
            )}

            {/* Specifications - Inventory products */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Technische Daten</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}</span>
                      <span className="text-gray-900 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Options (Size, Color, etc.) - Medusa products only */}
            {hasOptions && medusaProduct?.options && (
              <div className="space-y-4 mb-6">
                {medusaProduct.options.map((option) => (
                  <div key={option.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {option.title}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values?.map((value) => (
                        <button
                          key={value.id}
                          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          {value.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anzahl
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium text-lg"
                  disabled={!isAvailable || quantity <= 1}
                >
                  −
                </button>
                <span className="w-14 text-center font-semibold text-xl">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium text-lg"
                  disabled={!isAvailable}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.button
              onClick={handleAddToCart}
              disabled={addToCart.isPending || addedToCart || !isAvailable}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full rounded-xl px-6 py-4 text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg",
                isAvailable
                  ? addedToCart 
                    ? "bg-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl"
                  : "bg-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              <AnimatePresence mode="wait">
                {addToCart.isPending ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Wird hinzugefügt...
                  </motion.span>
                ) : addedToCart ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    {isInventoryProduct ? "Anfrage gemerkt!" : "In den Warenkorb gelegt!"}
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {!isAvailable ? "Nicht verfügbar" : isInventoryProduct ? "Anfrage senden" : "In den Warenkorb"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* View Cart Link / Contact Info */}
            <AnimatePresence>
              {addedToCart && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {isInventoryProduct ? (
                    <div className="mt-4 text-center text-sm text-gray-600">
                      <p className="mb-2">Kontaktieren Sie uns für dieses Produkt:</p>
                      <a
                        href="mailto:shop@revamp-it.ch"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        shop@revamp-it.ch →
                      </a>
                    </div>
                  ) : (
                    <Link
                      href="/shop/medusa/cart"
                      className="mt-4 block text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      Zum Warenkorb →
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                </div>
                <span>Professionell aufgearbeitet</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <span>Garantie inklusive</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-amber-600" />
                </div>
                <span>Schneller Versand</span>
              </div>
            </div>

            {/* Sustainability notice */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-emerald-800 font-medium mb-1">
                    Nachhaltig einkaufen
                  </p>
                  <p className="text-sm text-emerald-700">
                    Durch den Kauf von aufgearbeiteter Hardware trägst du aktiv zum Umweltschutz bei und reduzierst Elektroschrott.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
