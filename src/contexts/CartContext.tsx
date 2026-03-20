import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/api";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "artisan_cart";

const CartContext = createContext<CartContextType | null>(null);

function readStoredCart(): CartItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.listingId === item.listingId);
      if (!existing) return [...current, item];

      return current.map((entry) =>
        entry.listingId === item.listingId
          ? {
              ...entry,
              title: item.title,
              unitPrice: item.unitPrice,
              quantity: entry.quantity + item.quantity,
            }
          : entry,
      );
    });
  };

  const removeItem = (listingId: string) => {
    setItems((current) => current.filter((item) => item.listingId !== listingId));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
