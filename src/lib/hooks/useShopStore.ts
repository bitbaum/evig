"use client";

import { useSyncExternalStore, useCallback } from "react";

type Listener = () => void;

function createLocalStorageStore(key: string) {
  const listeners = new Set<Listener>();

  function getSnapshot(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function getServerSnapshot(): string[] {
    return [];
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);

    // Listen for changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function set(items: string[]) {
    localStorage.setItem(key, JSON.stringify(items));
    emit();
  }

  function add(id: string) {
    const current = getSnapshot();
    if (!current.includes(id)) {
      set([...current, id]);
    }
  }

  function remove(id: string) {
    set(getSnapshot().filter((i) => i !== id));
  }

  function toggle(id: string) {
    const current = getSnapshot();
    if (current.includes(id)) {
      set(current.filter((i) => i !== id));
    } else {
      set([...current, id]);
    }
  }

  function has(id: string): boolean {
    return getSnapshot().includes(id);
  }

  return { subscribe, getSnapshot, getServerSnapshot, add, remove, toggle, has };
}

const wishlistStore = createLocalStorageStore("shop_wishlist");
const compareStore = createLocalStorageStore("shop_compare");

export function useWishlist() {
  const items = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  return {
    items,
    count: items.length,
    add: useCallback(wishlistStore.add, []),
    remove: useCallback(wishlistStore.remove, []),
    toggle: useCallback(wishlistStore.toggle, []),
    has: useCallback(wishlistStore.has, []),
  };
}

export function useCompare() {
  const items = useSyncExternalStore(
    compareStore.subscribe,
    compareStore.getSnapshot,
    compareStore.getServerSnapshot,
  );

  return {
    items,
    count: items.length,
    add: useCallback(compareStore.add, []),
    remove: useCallback(compareStore.remove, []),
    toggle: useCallback(compareStore.toggle, []),
    has: useCallback(compareStore.has, []),
  };
}
