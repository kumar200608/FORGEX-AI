"use client";

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import StoreHeader from "@/components/StoreHeader";
import RunCollector from "@/components/RunCollector";
import ProductCard from "@/components/ProductCard";
import FilterSidebar, { DEFAULT_FILTERS, type FilterValue } from "@/components/FilterSidebar";
import { discountPct } from "@/components/PriceDisplay";
import products from "@/data/products.json";
import type { Product } from "@/types";

const ProductCarousel = dynamic(() => import("@/components/ProductCarousel"), { ssr: false });
const PromoBanner = dynamic(() => import("@/components/PromoBanner"), { ssr: false });
const RecommendationWidget = dynamic(() => import("@/components/RecommendationWidget"), { ssr: false });

const all = products as Product[];

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "discount";

function ProductsInner() {
  const { decision } = useAdaptiveMode();
  const router = useRouter();
  const params = useSearchParams();
  const isFull = decision.mode === "FULL" && !decision.changes.componentDeferred;

  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [filters, setFilters] = useState<FilterValue>(() => ({
    cat: params.get("cat") ?? DEFAULT_FILTERS.cat,
    brands: DEFAULT_FILTERS.brands,
    maxPrice: params.get("maxPrice") !== null ? Number(params.get("maxPrice")) || null : null,
    minRating: Number(params.get("rating") ?? 0) || 0,
    inStock: false,
  }));
  const [sort, setSort] = useState<SortKey>(() => {
    const s = params.get("sort");
    return s === "price-asc" || s === "price-desc" || s === "rating" || s === "discount"
      ? s
      : "featured";
  });

  const reduceMotion = decision.changes.animationsReduced;
  const prefetch = !decision.changes.prefetchDisabled;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((p) => {
      if (filters.cat !== "All" && (p.category ?? "Featured") !== filters.cat) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(p.brand ?? "")) return false;
      if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
      if (filters.minRating > 0 && (p.rating ?? 0) < filters.minRating) return false;
      if (filters.inStock && (p.stock ?? 1) <= 0) return false;
      if (q && !(p.name + " " + p.description).toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "rating":
        return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "discount":
        return [...list].sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice));
      default:
        return list;
    }
  }, [query, filters, sort]);

  const [showAll, setShowAll] = useState(false);

  const displayed = useMemo(() => {
    if (isFull || showAll) return filtered;
    return filtered.slice(0, 12);
  }, [filtered, isFull, showAll]);

  const syncQuery = (q: string) => {
    setQuery(q);
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    router.replace(`/products?${next.toString()}`);
  };

  return (
    <main>
      <RunCollector />
      <StoreHeader query={query} onQuery={syncQuery} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <FilterSidebar products={all} value={filters} onChange={setFilters} />
        <div className="min-w-0 flex-1">
          {isFull && <PromoBanner />}
          {isFull && <ProductCarousel products={all} />}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
            <p className="text-sm text-slate-600" role="status">
              {filtered.length > 0
                ? `Showing ${displayed.length} of ${filtered.length} result${filtered.length === 1 ? "" : "s"}`
                : `0 of ${all.length} results`}
            </p>
            <label className="flex items-center gap-2 text-sm">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="discount">Discount</option>
              </select>
            </label>
          </div>

          {filtered.length > 0 ? (
            <>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((p, i) => (
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
              {!isFull && !showAll && filtered.length > 12 && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Load remaining {filtered.length - 12} products
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium">No products match your filters.</p>
              <p className="mt-1 text-xs text-slate-500">Try a different search or clear the filters.</p>
              <button
                type="button"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  syncQuery("");
                }}
                className="mt-3 rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 motion-safe:transition motion-safe:active:scale-95"
              >
                Clear filters
              </button>
            </div>
          )}
          {isFull && <RecommendationWidget products={all} />}
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">Loading…</p>}>
      <ProductsInner />
    </Suspense>
  );
}
