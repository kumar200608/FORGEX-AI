"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAdaptiveMode } from "@/context/AdaptiveModeContext";
import products from "@/data/products.json";

type StoreHeaderProps = {
  query: string;
  onQuery: (q: string) => void;
};

function getCategories(): string[] {
  const set = new Set<string>();
  for (const p of products as { category?: string }[]) {
    if (p.category) set.add(p.category);
  }
  return Array.from(set).sort();
}

export default function StoreHeader({ query, onQuery }: StoreHeaderProps) {
  const router = useRouter();
  const { count } = useCart();
  const { decision } = useAdaptiveMode();
  const prefetch = !decision.changes.prefetchDisabled;
  const categories = useMemo(getCategories, []);
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (products as { id: string; name: string; category?: string }[])
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query]);

  const submit = (q = query, c = cat) => {
    setOpen(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (c && c !== "All") params.set("cat", c);
    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(-1, h - 1));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && suggestions[highlight]) {
        onQuery(suggestions[highlight].name);
        submit(suggestions[highlight].name, cat);
      } else {
        submit();
      }
    }
  };

  const searchGroup = (idPrefix: string, fullWidth: boolean) => (
    <div ref={boxRef} className={`relative ${fullWidth ? "w-full" : "min-w-0 flex-1"}`}>
      <div className="flex h-10 overflow-hidden rounded bg-white focus-within:outline focus-within:outline-2 focus-within:outline-orange-400">
        <select
          aria-label="Category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="hidden shrink-0 border-r border-slate-200 bg-slate-100 px-2 text-xs text-slate-700 outline-none sm:block"
        >
          <option value="All">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={query}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search adaptive.in"
          aria-label="Search products"
          className="min-w-0 flex-1 px-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none"
        />
        <button
          type="button"
          aria-label="Search"
          onClick={() => submit()}
          className="grid w-11 shrink-0 place-items-center bg-orange-400 text-slate-900 hover:bg-orange-300"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Suggestions"
          className="absolute inset-x-0 top-11 z-30 overflow-hidden rounded border border-slate-200 bg-white text-sm text-slate-800 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onQuery(s.name);
                  submit(s.name, cat);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`block w-full px-3 py-2 text-left hover:bg-slate-100 ${i === highlight ? "bg-slate-100" : ""}`}
              >
                {s.name}
                {s.category && <span className="ml-2 text-xs text-slate-500">{s.category}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-20 bg-[#0f0c29] text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Link
          href="/"
          prefetch={prefetch}
          className="shrink-0 rounded-sm px-1 text-lg font-bold tracking-tight outline-none hover:outline hover:outline-1 hover:outline-white"
        >
          adaptive<span className="text-orange-400">.in</span>
        </Link>
        <div className="hidden shrink-0 items-center gap-1 rounded-sm px-1 py-1 text-xs leading-tight hover:outline hover:outline-1 hover:outline-white md:flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-2 shrink-0">
            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>
            <span className="block text-[11px] text-slate-300">Deliver to</span>
            <span className="block text-[13px] font-bold">India 110001</span>
          </span>
        </div>
        <div className="hidden min-w-0 flex-1 md:block">{searchGroup("hdr", false)}</div>
        <Link
          href="#"
          prefetch={false}
          aria-disabled="true"
          title="Demo"
          className="hidden shrink-0 rounded-sm px-1 py-1 text-xs leading-tight hover:outline hover:outline-1 hover:outline-white lg:block"
        >
          <span className="block text-[11px]">Hello, Sign in</span>
          <span className="block text-[13px] font-bold">Account</span>
        </Link>
        <Link
          href="#"
          prefetch={false}
          aria-disabled="true"
          title="Demo"
          className="hidden shrink-0 rounded-sm px-1 py-1 text-xs leading-tight hover:outline hover:outline-1 hover:outline-white lg:block"
        >
          <span className="block text-[11px]">Returns</span>
          <span className="block text-[13px] font-bold">&amp; Orders</span>
        </Link>
        <Link
          href="/cart"
          prefetch={prefetch}
          aria-label={`Cart with ${count} items`}
          className="relative flex shrink-0 items-center gap-1 rounded-sm px-1 py-1 hover:outline hover:outline-1 hover:outline-white"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
            <path d="M2 3h3l2.6 12.5a1 1 0 0 0 1 .5h8.9a1 1 0 0 0 1-.8L21 7H6" />
          </svg>
          <span className="absolute left-4 top-0 min-w-4 rounded-full bg-orange-400 px-1 text-center text-[11px] font-bold leading-4 text-slate-900">
            {count}
          </span>
          <span className="hidden text-[13px] font-bold sm:block">Cart</span>
        </Link>
      </div>
      <div className="px-3 pb-2 md:hidden">{searchGroup("hdr-m", true)}</div>
    </header>
  );
}
