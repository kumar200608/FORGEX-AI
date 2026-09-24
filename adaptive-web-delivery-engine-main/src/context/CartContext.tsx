"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/types";
import products from "@/data/products.json";

const CART_KEY = "adaptivein.cart.v1";
const SAVED_KEY = "adaptivein.saved.v1";

export interface CartContextValue {
  items: CartItem[];
  saved: string[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  toggleSaved: (id: string) => void;
  count: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const priceById = new Map<string, { price: number; mrp: number }>(
  (products as { id: string; price: number; oldPrice?: number }[]).map((p) => [
    p.id,
    { price: p.price, mrp: p.oldPrice ?? p.price },
  ])
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  // Hydrate from localStorage after mount so server and client first render match.
  useEffect(() => {
    const storedItems = readLS<CartItem[]>(CART_KEY, []);
    if (storedItems.length > 0) setItems(storedItems);
    const storedSaved = readLS<string[]>(SAVED_KEY, []);
    if (storedSaved.length > 0) setSaved(storedSaved);
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* ignore quota errors */
    }
  }, [saved]);

  const value = useMemo<CartContextValue>(() => {
    const add = (id: string, qty = 1) => {
      const q = Math.max(1, Math.min(10, Math.floor(qty)));
      setItems((prev) => {
        const found = prev.find((i) => i.id === id);
        if (found) {
          return prev.map((i) => (i.id === id ? { ...i, qty: Math.min(10, i.qty + q) } : i));
        }
        return [...prev, { id, qty: q }];
      });
    };
    const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
    const setQty = (id: string, qty: number) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      const q = Math.max(1, Math.min(10, Math.floor(qty)));
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: q } : i)));
    };
    const clear = () => setItems([]);
    const toggleSaved = (id: string) =>
      setSaved((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

    const count = items.reduce((n, i) => n + i.qty, 0);
    let subtotal = 0;
    let mrpTotal = 0;
    for (const i of items) {
      const p = priceById.get(i.id);
      if (!p) continue;
      subtotal += p.price * i.qty;
      mrpTotal += p.mrp * i.qty;
    }
    const savings = Math.max(0, mrpTotal - subtotal);

    return { items, saved, add, remove, setQty, clear, toggleSaved, count, subtotal, mrpTotal, savings };
  }, [items, saved]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
