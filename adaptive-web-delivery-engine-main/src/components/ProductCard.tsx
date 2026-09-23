"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import ProductRating from "@/components/ProductRating";
import PriceDisplay from "@/components/PriceDisplay";
import type { AdaptiveMode, Product } from "@/types";

type ProductCardProps = {
  product: Product;
  mode: AdaptiveMode;
  prefetch: boolean;
  reduceMotion: boolean;
};

export default function ProductCard({ product, mode, prefetch, reduceMotion }: ProductCardProps) {
  const { add } = useCart();
  const [loaded, setLoaded] = useState(false);
  const stock = product.stock ?? null;
  const out = stock !== null && stock <= 0;
  const low = stock !== null && stock > 0 && stock < 5;
  const imageSrc = mode === "FULL" ? product.imageLarge : product.imageSmall;

  return (
    <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-2.5">
      {product.badge && (
        <span className="w-fit rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-800">
          {product.badge}
        </span>
      )}
      <Link href={`/product/${product.id}`} prefetch={prefetch} className="flex flex-col gap-1">
        <span className="relative block aspect-square overflow-hidden rounded">
          {!reduceMotion && !loaded && (
            <span aria-hidden="true" className="animate-shimmer absolute inset-0" />
          )}
          <Image
            src={imageSrc}
            alt={product.name}
            width={400}
            height={400}
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover${
              reduceMotion
                ? ""
                : " motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-105"
            }`}
          />
        </span>
        <span className="text-[11px] uppercase text-slate-500">{product.category ?? "Featured"}</span>
        <span className="line-clamp-2 text-sm">{product.name}</span>
      </Link>
      <ProductRating rating={product.rating} reviews={product.reviews} size="sm" />
      <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
      <span className={`text-xs ${product.freeDelivery !== false ? "text-green-700" : "text-slate-500"}`}>
        {product.freeDelivery !== false ? "FREE delivery" : "Delivery ₹40"}
      </span>
      {out ? (
        <span className="text-xs font-medium text-red-600">Out of stock</span>
      ) : low ? (
        <span className="text-xs font-medium text-orange-700">Only {stock} left</span>
      ) : null}
      <button
        type="button"
        disabled={out}
        onClick={() => add(product.id, 1)}
        className="mt-1 rounded-full bg-orange-500 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition motion-safe:active:scale-95"
      >
        Add to Cart
      </button>
    </div>
  );
}
