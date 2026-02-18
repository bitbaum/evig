"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  subtitle: string | null;
  thumbnail: string | null;
  is_giftcard: boolean;
  discountable: boolean;
  collection_id: string | null;
  type_id: string | null;
  weight: string | null;
  material: string | null;
  images: { id: string; url: string; rank: number }[];
  options: { id: string; title: string; values: { id: string; value: string }[] }[];
  variants: MedusaVariant[];
  collection?: { title: string } | null;
  tags?: { value: string }[];
  created_at: string;
  updated_at: string;
}

interface MedusaVariant {
  id: string;
  title: string;
  sku: string | null;
  inventory_quantity?: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  product_id: string;
  prices?: { amount: number; currency_code: string }[];
  calculated_price?: {
    calculated_amount: number;
    currency_code: string;
  };
  options: { id: string; value: string }[];
}

interface CartItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant: MedusaVariant;
  product: MedusaProduct;
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  tax_total: number;
  item_total?: number;
  region_id?: string;
}

interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: { iso_2: string; name: string }[];
}

// Product Hooks
export function useProducts(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.offset) searchParams.set("offset", String(params.offset));
      if (params?.q) searchParams.set("q", params.q);

      const response = await fetch(`/api/shop/products?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      return data as { products: MedusaProduct[]; count: number };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useProduct(handle: string) {
  return useQuery({
    queryKey: ["product", handle],
    queryFn: async () => {
      if (!handle) return null;
      const response = await fetch(`/api/shop/products?handle=${handle}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      const data = await response.json();
      return data.products?.[0] as MedusaProduct | null;
    },
    enabled: !!handle,
    staleTime: 30000,
  });
}

// Region hooks
export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/shop/regions");
      if (!response.ok) {
        throw new Error("Failed to fetch regions");
      }
      const json = await response.json();
      // API wraps in { success, data: { regions } }
      const data = json.data || json;
      return data.regions as Region[];
    },
    staleTime: 300000, // Cache for 5 minutes
  });
}

// Cart Hooks
export function useCart(cartId?: string | null) {
  return useQuery({
    queryKey: ["cart", cartId],
    queryFn: async () => {
      if (!cartId) return null;
      const response = await fetch(`/api/shop/cart/${cartId}`);
      if (!response.ok) {
        // Cart might have expired or been deleted
        if (typeof window !== "undefined") {
          localStorage.removeItem("cart_id");
        }
        return null;
      }
      const json = await response.json();
      const data = json.data || json;
      return data.cart as Cart;
    },
    enabled: !!cartId,
    staleTime: 0, // Always fresh
  });
}

export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regionId?: string) => {
      const response = await fetch("/api/shop/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_id: regionId }),
      });
      if (!response.ok) {
        throw new Error("Failed to create cart");
      }
      const json = await response.json();
      // API wraps in { success, data: { cart } }
      const data = json.data || json;
      return data.cart as Cart;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart", cart.id], cart);
      if (typeof window !== "undefined") {
        localStorage.setItem("cart_id", cart.id);
      }
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      variantId,
      quantity,
    }: {
      cartId: string;
      variantId: string;
      quantity: number;
    }) => {
      const response = await fetch(`/api/shop/cart/${cartId}/line-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: variantId,
          quantity,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }
      const json = await response.json();
      // API wraps in { success, data: { cart } }
      const data = json.data || json;
      return data.cart as Cart;
    },
    onSuccess: (cart) => {
      queryClient.invalidateQueries({ queryKey: ["cart", cart.id] });
    },
  });
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      lineId,
      quantity,
    }: {
      cartId: string;
      lineId: string;
      quantity: number;
    }) => {
      const response = await fetch(`/api/shop/cart/${cartId}/line-items/${lineId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to update item");
      }
      const json = await response.json();
      const data = json.data || json;
      return data.cart as Cart;
    },
    onSuccess: (cart) => {
      queryClient.invalidateQueries({ queryKey: ["cart", cart.id] });
    },
  });
}

export function useRemoveLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      lineId,
    }: {
      cartId: string;
      lineId: string;
    }) => {
      const response = await fetch(`/api/shop/cart/${cartId}/line-items/${lineId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove item");
      }
      const json = await response.json();
      const data = json.data || json;
      return data.cart as Cart;
    },
    onSuccess: (cart) => {
      queryClient.invalidateQueries({ queryKey: ["cart", cart.id] });
    },
  });
}

// Helper to get cart ID from localStorage
export function getCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cart_id");
}

// Export types
export type { MedusaProduct, MedusaVariant, Cart, CartItem, Region };
