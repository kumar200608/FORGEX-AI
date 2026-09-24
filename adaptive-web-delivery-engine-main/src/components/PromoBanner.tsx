"use client";
import Link from "next/link";

export default function PromoBanner() {
  return (
    <div className="mt-6 rounded-md bg-orange-500 p-4 text-white">
      <div className="text-sm font-semibold">Festive Sale — up to 40% off bestsellers</div>
      <div className="mt-0.5 text-xs text-white/85">Limited-time deals across top categories.</div>
      <Link
        href="/browse"
        className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-orange-700 motion-safe:transition motion-safe:hover:scale-105 motion-safe:active:scale-95"
      >
        Shop deals
      </Link>
    </div>
  );
}
