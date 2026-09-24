"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function OrderSummary({ showCheckoutButton = false }: { showCheckoutButton?: boolean }) {
  const { count, subtotal, mrpTotal, savings } = useCart();
  const freeDelivery = subtotal > 999;
  const deliveryFee = freeDelivery ? 0 : 40;
  const total = subtotal + deliveryFee;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <aside aria-label="Order summary" className="rounded-md border border-slate-200 bg-white p-4 text-sm">
      <h2 className="text-base font-semibold text-slate-900">Order Summary</h2>
      <dl className="mt-3 space-y-2 text-slate-700">
        <div className="flex items-center justify-between">
          <dt>Items subtotal</dt>
          <dd>{inr(mrpTotal)}</dd>
        </div>
        <div className="flex items-center justify-between text-green-700">
          <dt>Discount</dt>
          <dd>−{inr(savings)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Delivery</dt>
          <dd>{freeDelivery ? "FREE" : inr(deliveryFee)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <dt>Order Total</dt>
          <dd>{inr(total)}</dd>
        </div>
      </dl>
      {showCheckoutButton && count > 0 && (
        <Link
          href="/checkout"
          className="mt-4 block rounded-md bg-orange-500 px-4 py-2 text-center font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
        >
          Proceed to Checkout
        </Link>
      )}
    </aside>
  );
}
