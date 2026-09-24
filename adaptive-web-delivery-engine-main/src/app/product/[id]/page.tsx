"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import { useCart } from "@/context/CartContext";
import dynamic from "next/dynamic";
import AdaptationStatusPanel from "@/components/AdaptationStatusPanel";
const RecommendationWidget = dynamic(() => import("@/components/RecommendationWidget"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-500">Loading recommendations…</p>,
});
import StoreHeader from "@/components/StoreHeader";
import ProductRating from "@/components/ProductRating";
import PriceDisplay, { discountPct } from "@/components/PriceDisplay";
import type { Product } from "@/types";
import products from "@/data/products.json";

const REVIEW_NAMES = ["Aarav S.", "Priya M.", "Rohan K.", "Sneha R.", "Vikram D.", "Ananya I."];
const REVIEW_TITLES = ["Great value for money", "Does the job well", "Exceeded expectations", "Solid purchase"];
const REVIEW_BODIES = [
  "Build quality feels premium at this price. Delivery was quick and packaging was intact.",
  "Setup took a couple of minutes. Performance has been consistent so far in daily use.",
  "Matches the description exactly. Would recommend waiting for a sale to grab it cheaper.",
  "Good product overall with minor room for improvement. Customer support was helpful.",
];

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { decision, status } = useAdaptiveMode();
  const { add } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [variantOverride, setVariantOverride] = useState<"small" | "large" | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const product = (products as Product[]).find((p) => p.id === params.id);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("awd-recent-v1");
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      const list = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
      const next = [params.id, ...list.filter((id) => id !== params.id)].slice(0, 8);
      localStorage.setItem("awd-recent-v1", JSON.stringify(next));
      setRecentIds(next.filter((id) => id !== params.id));
    } catch {
      setRecentIds([]);
    }
  }, [params.id]);

  if (!product) return notFound();

  const isFull = decision.mode === "FULL";
  const variantInUse = variantOverride ?? (isFull ? "large" : "small");
  const imageSrc = variantInUse === "large" ? product.imageLarge : product.imageSmall;
  const motion = !decision.changes.animationsReduced;
  const prefetch = !decision.changes.prefetchDisabled;

  const brand = product.brand ?? "adaptive.in";
  const category = product.category ?? "Catalog";
  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const maxQty = Math.max(1, Math.min(stock, 10));
  const pct = discountPct(product.price, product.oldPrice);

  const related = (products as Product[])
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === category) - Number(a.category === category));

  const recentProducts = (products as Product[])
    .filter((p) => recentIds.includes(p.id))
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));

  const sentences = product.description.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  const bullets = [...sentences, `Category: ${category}`, `Brand: ${brand}`];

  const seed = product.id.length > 1 ? product.id.charCodeAt(1) : 0;
  const baseStars = Math.min(5, Math.max(1, Math.round(product.rating ?? 4.5)));
  const customerReviews = [0, 1].map((k) => ({
    name: REVIEW_NAMES[(seed + k * 3) % REVIEW_NAMES.length],
    title: REVIEW_TITLES[(seed + k) % REVIEW_TITLES.length],
    body: REVIEW_BODIES[(seed + k * 2) % REVIEW_BODIES.length],
    stars: k === 0 ? baseStars : Math.max(1, baseStars - 1),
  }));

  const handleAdd = () => {
    add(product.id, qty);
    setAdded(true);
  };
  const handleBuyNow = () => {
    add(product.id, qty);
    router.push("/checkout");
  };

  return (
    <main>
      <StoreHeader
        query={query}
        onQuery={(q) => {
          setQuery(q);
          router.push(`/products?q=${encodeURIComponent(q)}`);
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <AdaptationStatusPanel decision={decision} status={status} />

        <nav aria-label="Breadcrumb" className="mt-4 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" prefetch={prefetch} className="hover:text-slate-800 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>{category}</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-slate-800">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
          {/* LEFT: gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-md border border-slate-200 bg-white">
              {motion ? (
                <div
                  className="h-full w-full cursor-zoom-in overflow-hidden"
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setOrigin({
                      x: ((e.clientX - r.left) / r.width) * 100,
                      y: ((e.clientY - r.top) / r.height) * 100,
                    });
                  }}
                >
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    width={variantInUse === "large" ? 600 : 300}
                    height={variantInUse === "large" ? 600 : 300}
                    style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
                    className="h-auto w-full motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.8]"
                  />
                </div>
              ) : (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  width={variantInUse === "large" ? 600 : 300}
                  height={variantInUse === "large" ? 600 : 300}
                  className="h-auto w-full"
                />
              )}
            </div>
            <div className="mt-3 flex gap-3">
              {(
                [
                  { key: "small", src: product.imageSmall, label: "Small image" },
                  { key: "large", src: product.imageLarge, label: "Large image" },
                ] as const
              ).map((thumb) => (
                <button
                  key={thumb.key}
                  type="button"
                  onClick={() => setVariantOverride(thumb.key)}
                  aria-pressed={variantInUse === thumb.key}
                  aria-label={`View ${thumb.label}`}
                  className={`overflow-hidden rounded-md border border-slate-200 bg-white p-1 ${
                    motion ? "motion-safe:transition-colors" : ""
                  } ${
                    variantInUse === thumb.key ? "border-orange-500 ring-2 ring-orange-500" : "hover:border-slate-400"
                  }`}
                >
                  <Image src={thumb.src} alt="" width={64} height={64} className="h-16 w-16 rounded object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: info */}
          <div>
            {product.badge && (
              <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                {product.badge}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
            <Link
              href={`/products?q=${encodeURIComponent(brand)}`}
              prefetch={prefetch}
              className="mt-1 inline-block text-sm text-sky-700 hover:text-orange-700 hover:underline"
            >
              Visit the {brand} Store
            </Link>
            <div className="mt-1">
              <ProductRating rating={product.rating} reviews={product.reviews} size="md" />
            </div>

            <hr className="my-3 border-slate-200" />

            <h2 className="text-base font-semibold text-slate-900">About this item</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>

            {product.features && product.features.length > 0 && (
              <section aria-label="Features" className="mt-4">
                <h2 className="text-base font-semibold text-slate-900">Features</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {product.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </section>
            )}

            {product.specs && product.specs.length > 0 && (
              <section aria-label="Specifications" className="mt-4">
                <h2 className="text-base font-semibold text-slate-900">Specifications</h2>
                <dl className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white text-sm">
                  {product.specs.map((s) => (
                    <div key={s.label} className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-slate-500">{s.label}</dt>
                      <dd className="font-medium text-slate-900">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {product.colors && product.colors.length > 0 && (
              <section aria-label="Colors" className="mt-4">
                <h2 className="text-base font-semibold text-slate-900">Colors</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      aria-pressed={selectedColor === c}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        selectedColor === c
                          ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {selectedColor && <p className="mt-1 text-xs text-slate-600">Selected: {selectedColor}</p>}
              </section>
            )}

            <dl className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white text-sm">
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Brand</dt>
                <dd className="font-medium text-slate-900">{brand}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{category}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Delivery</dt>
                <dd className="font-medium text-slate-900">{product.freeDelivery ? "Free delivery" : "Delivery ₹40"}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Returns</dt>
                <dd className="font-medium text-slate-900">7-day replacement</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Warranty</dt>
                <dd className="font-medium text-slate-900">1-year</dd>
              </div>
            </dl>

            <section aria-label="Customer reviews" className="mt-4">
              <h2 className="text-base font-semibold text-slate-900">Customer reviews</h2>
              <div className="mt-2 space-y-3">
                {customerReviews.map((r) => (
                  <article key={r.name} className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-800">{r.name}</span>
                      <ProductRating rating={r.stars} size="sm" />
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{r.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: buy box */}
          <div>
            <div className="sticky top-20 rounded-md border border-slate-200 bg-white p-4">
              <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="md" />
              {pct > 0 && <p className="mt-0.5 text-xs text-green-700">Save {pct}% with today&apos;s deal</p>}
              <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes</p>

              <p className={`mt-3 text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
                {inStock ? "In Stock" : "Out of Stock"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {product.freeDelivery ? "FREE delivery" : "Delivery ₹40"} · 7-day replacement · 1-year warranty
              </p>
              {inStock && stock <= 5 && (
                <p className="mt-1 text-xs font-medium text-orange-700">Only {stock} left in stock — order soon.</p>
              )}

              <label htmlFor="qty" className="mt-3 block text-xs text-slate-600">
                Quantity
              </label>
              <select
                id="qty"
                value={qty}
                disabled={!inStock}
                onChange={(e) => {
                  setQty(Number(e.target.value));
                  setAdded(false);
                }}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                className="mt-3 w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock}
                className="mt-2 w-full rounded-md border border-orange-500 bg-white px-4 py-2 text-sm font-semibold text-orange-700 motion-safe:transition-colors hover:bg-orange-50 disabled:opacity-50"
              >
                Buy Now
              </button>
              {added && (
                <p role="status" className="mt-2 text-xs font-medium text-green-700">
                  ✓ Added to cart
                </p>
              )}
              <p className="mt-3 text-xs text-slate-500">🔒 Secure transaction · Ships from adaptive.in</p>
            </div>
          </div>
        </div>

        {mounted && isFull && recentProducts.length > 0 && (
          <section aria-label="Recently viewed" className="mt-6">
            <h2 className="text-base font-semibold text-slate-900">Recently viewed</h2>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
              {recentProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  prefetch={prefetch}
                  className="w-32 shrink-0 rounded-md border border-slate-200 bg-white p-2 hover:border-slate-400"
                >
                  <Image src={p.imageSmall} alt="" width={128} height={128} className="h-24 w-full rounded object-cover" />
                  <p className="mt-1 truncate text-xs font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-600">₹{p.price.toLocaleString("en-IN")}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <RecommendationWidget products={related} />
      </div>
    </main>
  );
}
