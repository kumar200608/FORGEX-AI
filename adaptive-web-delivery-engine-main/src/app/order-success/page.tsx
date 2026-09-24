"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function OrderSuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-lg rounded-md border border-slate-200 bg-white p-8 text-center">
          <p aria-hidden="true" className="text-6xl">
            ✅
          </p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Order placed, thank you!</h1>
          {orderId ? (
            <p className="mt-2 text-sm text-slate-600">
              Your order <span className="font-mono font-semibold text-slate-900">{orderId}</span> is confirmed
              and arrives in 5–7 days.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Your order is confirmed. A confirmation email is on its way.
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/products"
              className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
            >
              Continue shopping
            </Link>
            <Link
              href="/performance"
              className="rounded-md border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 motion-safe:transition-colors hover:border-slate-400"
            >
              View in Lab
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">Loading…</p>}>
      <OrderSuccessInner />
    </Suspense>
  );
}
