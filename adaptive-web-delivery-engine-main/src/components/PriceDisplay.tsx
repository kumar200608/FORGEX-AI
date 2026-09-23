export function discountPct(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

type PriceDisplayProps = {
  price: number;
  oldPrice?: number;
  size?: "sm" | "md";
};

export default function PriceDisplay({ price, oldPrice, size = "md" }: PriceDisplayProps) {
  const off = discountPct(price, oldPrice);
  const priceCls = size === "md" ? "text-lg" : "text-base";

  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`${priceCls} font-semibold`}>₹{price.toLocaleString("en-IN")}</span>
      {typeof oldPrice === "number" && oldPrice > price && (
        <>
          <span className="text-xs text-slate-500 line-through">
            ₹{oldPrice.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-green-700">{off}% off</span>
        </>
      )}
    </div>
  );
}
