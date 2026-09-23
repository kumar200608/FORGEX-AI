"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import AdaptationStatusPanel from "@/components/AdaptationStatusPanel";
import StoreHeader from "@/components/StoreHeader";
import ProductCard from "@/components/ProductCard";
import { discountPct } from "@/components/PriceDisplay";
import products from "@/data/products.json";
import type { Product } from "@/types";

// Heavy components are only imported/rendered when needed.
const ProductCarousel = dynamic(() => import("@/components/ProductCarousel"), { ssr: false });
const PromoBanner = dynamic(() => import("@/components/PromoBanner"), { ssr: false });

const all = products as Product[];

export default function Home() {
  const { decision, status } = useAdaptiveMode();
  const router = useRouter();
  const isFull = decision.mode === "FULL";
  const reduceMotion = decision.changes.animationsReduced;
  const prefetch = !decision.changes.prefetchDisabled;
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(all.map((p) => p.category ?? "Featured"))).slice(0, 4),
    []
  );

  const bestsellers = useMemo(
    () => [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4),
    []
  );

  const deals = useMemo(
    () => all.filter((p) => discountPct(p.price, p.oldPrice) > 0),
    []
  );

  const goBrowse = () => {
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("awd-recent-v1");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentIds(parsed.filter((v): v is string => typeof v === "string"));
        }
      }
    } catch {
      setRecentIds([]);
    }
  }, []);

  const recentProducts = useMemo(() => {
    if (!isFull || recentIds.length === 0) return [];
    const byId = new Map(all.map((p) => [p.id, p]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => p !== undefined)
      .slice(0, 4);
  }, [isFull, recentIds]);

  return (
    <main>
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            goBrowse();
          }
        }}
      >
        <StoreHeader query={query} onQuery={setQuery} />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <AdaptationStatusPanel decision={decision} status={status} />

        <section className="rounded-md bg-[#0f0c29] p-6 text-white">
          <h1 className="text-xl font-bold sm:text-2xl">The Festive Edit</h1>
          <p className="mt-1 text-sm text-white/80">
            Top-rated picks and festive deals, adapted to your connection.
          </p>
          <Link
            href="/products"
            className="mt-3 inline-block rounded-full bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 motion-safe:transition motion-safe:active:scale-95"
          >
            Shop all products
          </Link>
        </section>

        {isFull && <PromoBanner />}
        {isFull && <ProductCarousel products={all} />}

        <h2 className="mt-6 text-sm font-semibold">Shop by category</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/products?cat=${encodeURIComponent(c)}`}
              prefetch={prefetch}
              className="rounded-md border border-slate-200 bg-white p-4 text-center text-sm font-medium hover:border-slate-300 motion-safe:transition motion-safe:active:scale-95"
            >
              {c}
            </Link>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-semibold">Bestsellers</h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map((p, i) => (
            <div
              key={p.id}
              className={reduceMotion ? "" : "motion-safe:animate-fadeUp"}
              style={reduceMotion ? undefined : { animationDelay: `${Math.min(i, 7) * 45}ms` }}
            >
              <ProductCard
                product={p}
                mode={decision.mode}
                prefetch={prefetch}
                reduceMotion={reduceMotion}
              />
            </div>
          ))}
        </div>

        {deals.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold">Deals</h2>
            <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
              {deals.map((p, i) => (
                <div
                  key={p.id}
                  className={`w-56 shrink-0 sm:w-64 ${reduceMotion ? "" : "motion-safe:animate-fadeUp"}`}
                  style={reduceMotion ? undefined : { animationDelay: `${Math.min(i, 7) * 45}ms` }}
                >
                  <ProductCard
                    product={p}
                    mode={decision.mode}
                    prefetch={prefetch}
                    reduceMotion={reduceMotion}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {isFull && recentProducts.length > 0 && (
          <section aria-label="Recently viewed">
            <h2 className="mt-6 text-sm font-semibold">Recently viewed</h2>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.id}`}
                    prefetch={prefetch}
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5 hover:border-slate-300"
                  >
                    <Image
                      src={decision.mode === "FULL" ? p.imageLarge : p.imageSmall}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 block text-sm font-medium text-slate-900">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
