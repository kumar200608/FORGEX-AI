"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import products from "@/data/products.json";

function getCategories(): string[] {
  const set = new Set<string>();
  for (const p of products as { category?: string }[]) {
    if (p.category) set.add(p.category);
  }
  return Array.from(set).sort();
}

const STATIC_LINKS: { label: string; href: string; demo?: boolean }[] = [
  { label: "Today's Deals", href: "/products?sort=discount" },
  { label: "New Arrivals", href: "/products?cat=Wearables" },
  { label: "Best Sellers", href: "/products?sort=rating" },
  { label: "Electronics", href: "/products?cat=Accessories" },
  { label: "Fashion", href: "#", demo: true },
  { label: "Home", href: "/products?cat=Home" },
  { label: "Grocery", href: "#", demo: true },
  { label: "Performance Lab", href: "/performance" },
];

export default function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { decision } = useAdaptiveMode();
  const prefetch = !decision.changes.prefetchDisabled;
  const categories = getCategories();

  return (
    <nav aria-label="Site" className="bg-[#232f3e] text-sm text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-3 sm:px-4">
        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Open category menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-sm px-2 py-2 font-bold hover:outline hover:outline-1 hover:outline-white"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            All
          </button>
          {menuOpen && (
            <ul className="absolute left-0 top-full z-30 w-48 overflow-hidden rounded-b border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg">
              {categories.map((c) => (
                <li key={c}>
                  <Link
                    href={`/products?cat=${encodeURIComponent(c)}`}
                    prefetch={prefetch}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-slate-100"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
          {STATIC_LINKS.map((l) =>
            l.demo ? (
              <li key={l.label} className="shrink-0">
                <Link
                  href={l.href}
                  prefetch={false}
                  aria-disabled="true"
                  title="Demo"
                  onClick={(e) => e.preventDefault()}
                  className="block rounded-sm px-2 py-2 text-slate-300 hover:outline hover:outline-1 hover:outline-white"
                >
                  {l.label}
                </Link>
              </li>
            ) : (
              <li key={l.label} className="shrink-0">
                <Link href={l.href} prefetch={prefetch} className="block rounded-sm px-2 py-2 hover:outline hover:outline-1 hover:outline-white">
                  {l.label}
                </Link>
              </li>
            )
          )}
        </ul>
      </div>
    </nav>
  );
}
