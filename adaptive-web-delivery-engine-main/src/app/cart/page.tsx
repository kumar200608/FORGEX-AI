"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import OrderSummary from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";
import products from "@/data/products.json";

const byId = new Map<string, Product>((products as Product[]).map((p) => [p.id, p]));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function CartPage() {
  const { items, saved, add, remove, setQty, toggleSaved, count } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");

  if (count === 0 && items.length === 0 && saved.length === 0) {
    return (
      <main>
        <StoreHeader
          query={query}
          onQuery={(q) => {
            setQuery(q);
            router.push(`/browse?q=${encodeURIComponent(q)}`);
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p aria-hidden="true" className="text-6xl">
            🛒
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Your cart is empty</h1>
          <p className="mt-1 text-sm text-slate-600">Deals are waiting — go grab something you love.</p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
          >
            Shop today&apos;s deals
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <StoreHeader
        query={query}
        onQuery={(q) => {
          setQuery(q);
          router.push(`/browse?q=${encodeURIComponent(q)}`);
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Shopping Cart <span className="text-base font-normal text-slate-500">({count} item{count === 1 ? "" : "s"})</span>
        </h1>

        {items.length === 0 ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-white p-8 text-center">
            <p aria-hidden="true" className="text-5xl">
              🛒
            </p>
            <p className="mt-3 text-sm text-slate-600">Your cart is empty, but your saved items are below.</p>
            <Link
              href="/browse"
              className="mt-4 inline-block rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
            >
              Shop today&apos;s deals
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => {
                const p = byId.get(item.id);
                if (!p) return null;
                const stock = p.stock ?? 10;
                const out = stock === 0;
                const max = Math.max(1, Math.min(stock, 10));
                const isSaved = saved.includes(item.id);
                return (
                  <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="flex gap-4">
                      <Link href={`/product/${p.id}`} prefetch={true} className="shrink-0">
                        <Image
                          src={p.imageSmall}
                          alt={p.name}
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-md border border-slate-200 object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${p.id}`}
                          prefetch={true}
                          className="font-medium text-slate-900 hover:text-orange-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.brand && <p className="text-xs text-slate-500">{p.brand}</p>}
                        {out ? (
                          <p className="mt-1 text-xs font-medium text-red-600">Out of Stock</p>
                        ) : (
                          stock <= 5 && (
                            <p className="mt-1 text-xs font-medium text-orange-700">Only {stock} left in stock</p>
                          )
                        )}
                        <p className="mt-1 text-sm text-slate-600">
                          {inr(p.price)} <span className="text-xs text-slate-500">each</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div
                            className="inline-flex items-center rounded-md border border-slate-200"
                            role="group"
                            aria-label={`Quantity for ${p.name}`}
                          >
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQty(item.id, item.qty - 1)}
                              className="px-2.5 py-1 text-sm font-semibold text-slate-700 motion-safe:transition-colors hover:bg-slate-100"
                            >
                              −
                            </button>
                            <span aria-live="polite" className="min-w-8 text-center text-sm font-medium">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQty(item.id, Math.min(item.qty + 1, max))}
                              disabled={item.qty >= max}
                              className="px-2.5 py-1 text-sm font-semibold text-slate-700 motion-safe:transition-colors hover:bg-slate-100 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="text-xs text-sky-700 hover:text-orange-700 hover:underline"
                          >
                            Remove
                          </button>
                          <span aria-hidden="true" className="text-xs text-slate-300">
                            |
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSaved(item.id)}
                            aria-pressed={isSaved}
                            className="text-xs text-sky-700 hover:text-orange-700 hover:underline"
                          >
                            {isSaved ? "Saved ✓" : "Save for later"}
                          </button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-slate-900">{inr(p.price * item.qty)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
            <div>
              <div className="lg:sticky lg:top-20">
                <OrderSummary showCheckoutButton />
              </div>
            </div>
          </div>
        )}

        {saved.length > 0 && (
          <section aria-label="Wishlist / Saved for later" className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Wishlist / Saved for later ({saved.length})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {saved.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <article key={id} className="rounded-md border border-slate-200 bg-white p-3">
                    <Link href={`/product/${p.id}`} prefetch={true}>
                      <Image
                        src={p.imageSmall}
                        alt={p.name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-md border border-slate-200 object-cover"
                      />
                    </Link>
                    <Link
                      href={`/product/${p.id}`}
                      prefetch={true}
                      className="mt-2 line-clamp-2 block min-h-[2.5rem] text-sm font-medium text-slate-900 hover:text-orange-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 text-sm font-semibold">{inr(p.price)}</p>
                    <button
                      type="button"
                      onClick={() => {
                        add(id, 1);
                        toggleSaved(id);
                      }}
                      className="mt-2 w-full rounded-md border border-orange-500 px-3 py-1.5 text-xs font-semibold text-orange-700 motion-safe:transition-colors hover:bg-orange-50"
                    >
                      Move to cart
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
