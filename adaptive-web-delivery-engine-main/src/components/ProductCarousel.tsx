"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

export default function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = products.slice(0, 6);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (slides.length === 0) return null;

  return (
    <section
      aria-label="Featured products"
      className="mt-6 rounded-md border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Featured</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Scroll featured left"
            onClick={() => scrollBy(-1)}
            className="rounded-full border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 motion-safe:transition motion-safe:active:scale-95"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Scroll featured right"
            onClick={() => scrollBy(1)}
            className="rounded-full border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 motion-safe:transition motion-safe:active:scale-95"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={trackRef} className="mt-3 flex gap-3 overflow-x-auto pb-1 motion-safe:scroll-smooth">
        {slides.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            prefetch={false}
            className="w-36 shrink-0 rounded-md border border-slate-200 bg-white p-2"
          >
            <span className="block aspect-square overflow-hidden rounded">
              <Image
                src={p.imageSmall}
                alt={p.name}
                width={400}
                height={200}
                className="h-auto w-full"
              />
            </span>
            <span className="mt-1.5 line-clamp-2 block text-sm">{p.name}</span>
            <span className="mt-0.5 block text-sm font-semibold">
              ₹{p.price.toLocaleString("en-IN")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
