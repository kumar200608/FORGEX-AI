"use client";

import { useMemo } from "react";
import type { Product } from "@/types";

export interface FilterValue {
  cat: string;
  brands: string[];
  maxPrice: number | null;
  minRating: number;
  inStock: boolean;
}

export const DEFAULT_FILTERS: FilterValue = {
  cat: "All",
  brands: [],
  maxPrice: null,
  minRating: 0,
  inStock: false,
};

type FilterSidebarProps = {
  products: Product[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
};

const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Any price", value: null },
  { label: "Under ₹2,000", value: 2000 },
  { label: "Under ₹5,000", value: 5000 },
];

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: "Any rating", value: 0 },
  { label: "3★ & above", value: 3 },
  { label: "4★ & above", value: 4 },
];

export default function FilterSidebar({ products, value, onChange }: FilterSidebarProps) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category ?? "Featured")))],
    [products]
  );
  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand).filter((b): b is string => typeof b === "string"))
      ),
    [products]
  );

  const toggleBrand = (brand: string) => {
    onChange({
      ...value,
      brands: value.brands.includes(brand)
        ? value.brands.filter((b) => b !== brand)
        : [...value.brands, brand],
    });
  };

  return (
    <aside className="sticky top-20 w-full shrink-0 self-start rounded-md border border-slate-200 bg-white p-3 text-sm md:w-56">
      <div className="font-semibold">Filters</div>

      <fieldset className="mt-3">
        <legend className="text-xs font-medium uppercase text-slate-500">Category</legend>
        <div className="mt-1.5 space-y-1">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input
                type="radio"
                name="filter-cat"
                checked={value.cat === c}
                onChange={() => onChange({ ...value, cat: c })}
                className="accent-orange-500"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      {brands.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-xs font-medium uppercase text-slate-500">Brand</legend>
          <div className="mt-1.5 space-y-1">
            {brands.map((b) => (
              <label key={b} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.brands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className="accent-orange-500"
                />
                {b}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-3">
        <legend className="text-xs font-medium uppercase text-slate-500">Price</legend>
        <div className="mt-1.5 space-y-1">
          {PRICE_OPTIONS.map((o) => (
            <label key={o.label} className="flex items-center gap-2">
              <input
                type="radio"
                name="filter-price"
                checked={value.maxPrice === o.value}
                onChange={() => onChange({ ...value, maxPrice: o.value })}
                className="accent-orange-500"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-xs font-medium uppercase text-slate-500">Rating</legend>
        <div className="mt-1.5 space-y-1">
          {RATING_OPTIONS.map((o) => (
            <label key={o.label} className="flex items-center gap-2">
              <input
                type="radio"
                name="filter-rating"
                checked={value.minRating === o.value}
                onChange={() => onChange({ ...value, minRating: o.value })}
                className="accent-orange-500"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-xs font-medium uppercase text-slate-500">Availability</legend>
        <label className="mt-1.5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.inStock}
            onChange={(e) => onChange({ ...value, inStock: e.target.checked })}
            className="accent-orange-500"
          />
          In stock only
        </label>
      </fieldset>
    </aside>
  );
}
