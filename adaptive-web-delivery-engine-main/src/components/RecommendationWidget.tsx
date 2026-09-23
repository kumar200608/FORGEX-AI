"use client";
import Link from "next/link";
import Image from "next/image";
import type { Product, RecommendationEntry } from "@/types";
import fallbackProducts from "@/data/products.json";
import recommendations from "@/data/recommendations.json";
import ProductRating from "@/components/ProductRating";

// recommendations.json maps productId -> relatedIds; used below to surface
// known-related items first when the incoming list contains them (no prop
// changes — products prop stays the single input).
const relatedFirst = new Map<string, Set<string>>();
((recommendations as RecommendationEntry[]) || []).forEach((r) => {
  relatedFirst.set(r.productId, new Set(r.relatedIds));
});

function orderByRecommendations(items: Product[]): Product[] {
  const knownIds = new Set<string>();
  relatedFirst.forEach((ids) => {
    ids.forEach((id) => knownIds.add(id));
  });
  // Stable: items already related to the current product keep their order;
  // items present in recommendations.json rank first.
  return [...items].sort(
    (a, b) => Number(knownIds.has(b.id)) - Number(knownIds.has(a.id))
  );
}

export default function RecommendationWidget({ products = fallbackProducts as Product[] }: { products?: Product[] }) {
  const suggestions = orderByRecommendations(products as Product[]).slice(0, 8);

  return (
    <section aria-label="Related products" className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-base font-semibold text-slate-800">Products related to this item</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
        {suggestions.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            prefetch={true}
            className="min-w-[160px] max-w-[160px] snap-start rounded-md border border-slate-200 bg-white p-2 motion-safe:transition-colors hover:border-slate-400"
          >
            <Image
              src={p.imageSmall}
              alt={p.name}
              width={144}
              height={144}
              className="h-36 w-full rounded object-cover"
            />
            <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-800">{p.name}</p>
            <ProductRating rating={p.rating} size="sm" />
            <p className="mt-1 text-sm font-semibold text-slate-900">
              ₹{(p.price as number).toLocaleString("en-IN")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
