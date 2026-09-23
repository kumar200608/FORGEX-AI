"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import OrderSummary from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";
import products from "@/data/products.json";

const byId = new Map<string, Product>((products as Product[]).map((p) => [p.id, p]));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STEPS = ["Address", "Delivery", "Payment", "Review", "Confirmed"] as const;

type FormData = {
  name: string;
  address: string;
  city: string;
  pin: string;
  phone: string;
  method: "standard" | "express";
  pay: "upi" | "card" | "cod";
  upi: string;
  cardNum: string;
  expiry: string;
  cvv: string;
};

const INITIAL: FormData = {
  name: "",
  address: "",
  city: "",
  pin: "",
  phone: "",
  method: "standard",
  pay: "upi",
  upi: "",
  cardNum: "",
  expiry: "",
  cvv: "",
};

const inputCls =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400";
const labelCls = "block text-xs font-medium text-slate-600";
const errCls = "mt-1 text-xs text-red-600";

export default function CheckoutPage() {
  const { items, count, subtotal, clear } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const clearedRef = useRef(false);

  const shipFee = data.method === "express" ? 99 : 0;
  const grandTotal = subtotal + shipFee;

  // Clear the cart exactly once after the order is confirmed.
  useEffect(() => {
    if (step === 4 && orderId && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
  }, [step, orderId, clear]);

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  const validateAddress = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = "Please enter your full name.";
    if (!data.address.trim()) e.address = "Please enter your street address.";
    if (!data.city.trim()) e.city = "Please enter your city.";
    if (!/^\d{6}$/.test(data.pin.trim())) e.pin = "PIN code must be 6 digits.";
    if (!/^\d{10}$/.test(data.phone.replace(/\D/g, ""))) e.phone = "Phone number must be 10 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = (): boolean => {
    const e: Record<string, string> = {};
    if (data.pay === "upi") {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(data.upi.trim())) e.upi = "Enter a valid UPI ID (e.g. name@bank).";
    } else if (data.pay === "card") {
      if (!/^\d{16}$/.test(data.cardNum.replace(/\s/g, ""))) e.cardNum = "Card number must be 16 digits.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry.trim())) e.expiry = "Use MM/YY format.";
      if (!/^\d{3}$/.test(data.cvv.trim())) e.cvv = "CVV must be 3 digits.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateAddress()) return;
    if (step === 2 && !validatePayment()) return;
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };

  const handlePlaceOrder = () => {
    const id = `AI${Date.now().toString(36).toUpperCase()}`;
    setOrderId(id);
    setErrors({});
    setStep(4);
    router.push(`/order-success?orderId=${id}`);
  };

  // Empty-cart guard (skipped once the order is confirmed).
  if (count === 0 && step !== 4) {
    return (
      <main>
        <StoreHeader
          query={query}
          onQuery={(q) => {
            setQuery(q);
            router.push(`/browse?q=${encodeURIComponent(q)}`);
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p aria-hidden="true" className="text-6xl">
            🛒
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Your cart is empty</h1>
          <p className="mt-1 text-sm text-slate-600">Add something to your cart before checking out.</p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
          >
            Shop today&apos;s deals
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <StoreHeader
        query={query}
        onQuery={(q) => {
          setQuery(q);
          router.push(`/browse?q=${encodeURIComponent(q)}`);
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>

        {/* Progress bar */}
        <ol aria-label="Checkout progress" className="mt-4 flex items-center gap-1 sm:gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-full flex-col items-center gap-1">
                <span
                  aria-current={i === step ? "step" : undefined}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-green-600 text-white"
                      : i === step
                        ? "bg-orange-500 text-white"
                        : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span
                  className={`truncate text-[11px] sm:text-xs ${
                    i === step ? "font-semibold text-slate-900" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={`mx-1 mb-5 h-0.5 flex-1 ${i < step ? "bg-green-600" : "bg-slate-200"}`} />
              )}
            </li>
          ))}
        </ol>

        {step === 4 && orderId ? (
          /* Confirmation */
          <div className="mx-auto mt-6 max-w-lg rounded-md border border-slate-200 bg-white p-8 text-center">
            <p aria-hidden="true" className="text-6xl">
              ✅
            </p>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Order placed, thank you!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your order <span className="font-mono font-semibold text-slate-900">{orderId}</span> is confirmed
              {data.method === "express" ? " and arrives in 2 days." : " and arrives in 5–7 days."}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/browse"
                className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
              >
                Continue shopping
              </Link>
              <Link
                href="/lab"
                className="rounded-md border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 motion-safe:transition-colors hover:border-slate-400"
              >
                Rate in Lab
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
                {step === 0 && (
                  <fieldset>
                    <legend className="text-base font-semibold text-slate-900">Delivery address</legend>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="co-name" className={labelCls}>
                          Full name
                        </label>
                        <input
                          id="co-name"
                          value={data.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Aarav Sharma"
                          autoComplete="name"
                          className={inputCls}
                        />
                        {errors.name && <p className={errCls}>{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="co-address" className={labelCls}>
                          Street address
                        </label>
                        <input
                          id="co-address"
                          value={data.address}
                          onChange={(e) => set("address", e.target.value)}
                          placeholder="Flat 4B, MG Road"
                          autoComplete="street-address"
                          className={inputCls}
                        />
                        {errors.address && <p className={errCls}>{errors.address}</p>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label htmlFor="co-city" className={labelCls}>
                            City
                          </label>
                          <input
                            id="co-city"
                            value={data.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="Bengaluru"
                            autoComplete="address-level2"
                            className={inputCls}
                          />
                          {errors.city && <p className={errCls}>{errors.city}</p>}
                        </div>
                        <div>
                          <label htmlFor="co-pin" className={labelCls}>
                            PIN code
                          </label>
                          <input
                            id="co-pin"
                            value={data.pin}
                            onChange={(e) => set("pin", e.target.value)}
                            placeholder="560001"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            className={inputCls}
                          />
                          {errors.pin && <p className={errCls}>{errors.pin}</p>}
                        </div>
                        <div>
                          <label htmlFor="co-phone" className={labelCls}>
                            Phone
                          </label>
                          <input
                            id="co-phone"
                            value={data.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="9876543210"
                            inputMode="tel"
                            autoComplete="tel"
                            className={inputCls}
                          />
                          {errors.phone && <p className={errCls}>{errors.phone}</p>}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                )}

                {step === 1 && (
                  <fieldset>
                    <legend className="text-base font-semibold text-slate-900">Delivery method</legend>
                    <div className="mt-4 space-y-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 motion-safe:transition-colors hover:border-slate-400">
                        <input
                          type="radio"
                          name="method"
                          checked={data.method === "standard"}
                          onChange={() => set("method", "standard")}
                          className="accent-orange-500"
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium text-slate-900">Standard — FREE</span>
                          <span className="block text-xs text-slate-500">Delivery in 5–7 days</span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 motion-safe:transition-colors hover:border-slate-400">
                        <input
                          type="radio"
                          name="method"
                          checked={data.method === "express"}
                          onChange={() => set("method", "express")}
                          className="accent-orange-500"
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium text-slate-900">Express — {inr(99)}</span>
                          <span className="block text-xs text-slate-500">Delivery in 2 days</span>
                        </span>
                      </label>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Shipping for this order: {shipFee === 0 ? "FREE" : inr(shipFee)}
                    </p>
                  </fieldset>
                )}

                {step === 2 && (
                  <fieldset>
                    <legend className="text-base font-semibold text-slate-900">Payment method</legend>
                    <div className="mt-4 space-y-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 motion-safe:transition-colors hover:border-slate-400">
                        <input
                          type="radio"
                          name="pay"
                          checked={data.pay === "upi"}
                          onChange={() => set("pay", "upi")}
                          className="accent-orange-500"
                        />
                        <span className="text-sm font-medium text-slate-900">UPI</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 motion-safe:transition-colors hover:border-slate-400">
                        <input
                          type="radio"
                          name="pay"
                          checked={data.pay === "card"}
                          onChange={() => set("pay", "card")}
                          className="accent-orange-500"
                        />
                        <span className="text-sm font-medium text-slate-900">Credit / Debit card</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 motion-safe:transition-colors hover:border-slate-400">
                        <input
                          type="radio"
                          name="pay"
                          checked={data.pay === "cod"}
                          onChange={() => set("pay", "cod")}
                          className="accent-orange-500"
                        />
                        <span className="text-sm font-medium text-slate-900">Cash on Delivery</span>
                      </label>
                    </div>

                    {data.pay === "upi" && (
                      <div className="mt-3">
                        <label htmlFor="co-upi" className={labelCls}>
                          UPI ID
                        </label>
                        <input
                          id="co-upi"
                          value={data.upi}
                          onChange={(e) => set("upi", e.target.value)}
                          placeholder="name@bank"
                          inputMode="email"
                          className={inputCls}
                        />
                        {errors.upi && <p className={errCls}>{errors.upi}</p>}
                      </div>
                    )}
                    {data.pay === "card" && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label htmlFor="co-card" className={labelCls}>
                            Card number
                          </label>
                          <input
                            id="co-card"
                            value={data.cardNum}
                            onChange={(e) => set("cardNum", e.target.value)}
                            placeholder="4111 1111 1111 1111"
                            inputMode="numeric"
                            className={inputCls}
                          />
                          {errors.cardNum && <p className={errCls}>{errors.cardNum}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="co-expiry" className={labelCls}>
                              Expiry (MM/YY)
                            </label>
                            <input
                              id="co-expiry"
                              value={data.expiry}
                              onChange={(e) => set("expiry", e.target.value)}
                              placeholder="12/28"
                              inputMode="numeric"
                              className={inputCls}
                            />
                            {errors.expiry && <p className={errCls}>{errors.expiry}</p>}
                          </div>
                          <div>
                            <label htmlFor="co-cvv" className={labelCls}>
                              CVV
                            </label>
                            <input
                              id="co-cvv"
                              value={data.cvv}
                              onChange={(e) => set("cvv", e.target.value)}
                              placeholder="123"
                              inputMode="numeric"
                              type="password"
                              className={inputCls}
                            />
                            {errors.cvv && <p className={errCls}>{errors.cvv}</p>}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">Demo only — no real payment is processed.</p>
                      </div>
                    )}
                    {data.pay === "cod" && (
                      <p className="mt-3 text-xs text-slate-500">Pay in cash or UPI when your order arrives.</p>
                    )}
                  </fieldset>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Review your order</h2>
                    <ul className="mt-4 space-y-2">
                      {items.map((item) => {
                        const p = byId.get(item.id);
                        if (!p) return null;
                        return (
                          <li key={item.id} className="flex items-center gap-3 text-sm">
                            <Image
                              src={p.imageSmall}
                              alt=""
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                            />
                            <span className="flex-1 text-slate-800">
                              {p.name} <span className="text-xs text-slate-500">× {item.qty}</span>
                            </span>
                            <span className="font-medium">{inr(p.price * item.qty)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 rounded-md bg-stone-100 p-3 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">Deliver to</p>
                      <p>
                        {data.name}, {data.address}, {data.city} — {data.pin}
                      </p>
                      <p>Phone: {data.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {data.method === "express" ? "Express delivery (2 days)" : "Standard delivery (5–7 days)"} ·{" "}
                        {data.pay === "upi" ? `UPI (${data.upi})` : data.pay === "card" ? "Card" : "Cash on Delivery"}
                      </p>
                    </div>
                    <dl className="mt-4 space-y-1 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <dt>Items subtotal</dt>
                        <dd>{inr(subtotal)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Shipping ({data.method})</dt>
                        <dd>{shipFee === 0 ? "FREE" : inr(shipFee)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                        <dt>Order Total</dt>
                        <dd>{inr(grandTotal)}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div className="mt-6 flex justify-between gap-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStep((s) => s - 1);
                      }}
                      className="rounded-md border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 motion-safe:transition-colors hover:border-slate-400"
                    >
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {step === 3 ? (
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
                    >
                      Place Order · {inr(grandTotal)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-orange-600"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="lg:sticky lg:top-20">
                <OrderSummary />
                <p className="mt-2 text-xs text-slate-500">
                  + {shipFee === 0 ? "FREE" : inr(shipFee)} {data.method} shipping at review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
