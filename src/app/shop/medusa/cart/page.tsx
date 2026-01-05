"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, Package } from "lucide-react";
import {
  useCart,
  getCartId,
  useUpdateLineItem,
  useRemoveLineItem,
} from "@/lib/medusa/hooks";
import { cn } from "@/lib/utils";
import type { MedusaCartItem } from "@/types/common";

export default function CartPage() {
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getCartId());
  }, []);

  const { data: cart, isLoading } = useCart(cartId || undefined);
  const updateLineItem = useUpdateLineItem();
  const removeLineItem = useRemoveLineItem();

  const handleUpdateQuantity = (lineId: string, quantity: number) => {
    if (!cartId || quantity < 1) return;
    updateLineItem.mutate({ cartId, lineId, quantity });
  };

  const handleRemoveItem = (lineId: string) => {
    if (!cartId) return;
    removeLineItem.mutate({ cartId, lineId });
  };

  const total = cart?.items?.reduce((sum: number, item: MedusaCartItem) => {
    const price = item.unit_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const formattedTotal = total
    ? new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
      }).format(total / 100)
    : "CHF 0.00";

  const itemCount = cart?.items?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back link */}
        <Link
          href="/shop/medusa"
          className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Weiter einkaufen
        </Link>

        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Warenkorb
          </h1>
          {itemCount > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {itemCount} {itemCount === 1 ? "Artikel" : "Artikel"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-4 w-1/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ihr Warenkorb ist leer
            </h2>
            <p className="text-gray-600 mb-6">
              Entdecken Sie unsere nachhaltig aufgearbeitete Hardware
            </p>
            <Link
              href="/shop/medusa"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              Jetzt einkaufen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: MedusaCartItem) => {
                const price = item.unit_price || 0;
                const formattedPrice = new Intl.NumberFormat("de-CH", {
                  style: "currency",
                  currency: "CHF",
                }).format(price / 100);

                const itemTotal = new Intl.NumberFormat("de-CH", {
                  style: "currency",
                  currency: "CHF",
                }).format((price * item.quantity) / 100);

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    {/* Product Image */}
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          aria-label="Artikel entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {formattedPrice} pro Stück
                      </p>

                      {/* Bottom row: quantity + total */}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                            aria-label="Menge verringern"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                            aria-label="Menge erhöhen"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <span className="font-semibold text-gray-900">
                          {itemTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Zusammenfassung
                </h2>

                <div className="space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Zwischensumme</span>
                    <span className="font-medium text-gray-900">{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Versand</span>
                    <span className="text-gray-500">Wird berechnet</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formattedTotal}</span>
                </div>

                <button
                  disabled
                  className="mt-6 w-full rounded-lg bg-gray-300 px-6 py-3.5 text-white font-medium cursor-not-allowed"
                >
                  Checkout (Coming Soon)
                </button>

                <p className="mt-4 text-xs text-center text-gray-500">
                  Zahlungsintegration folgt in Phase 2
                </p>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Sichere Zahlung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Garantie auf alle Produkte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Nachhaltig & umweltfreundlich</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
