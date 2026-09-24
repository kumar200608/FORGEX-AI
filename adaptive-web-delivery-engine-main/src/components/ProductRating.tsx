type ProductRatingProps = {
  rating?: number;
  reviews?: number;
  size?: "sm" | "md";
};

export default function ProductRating({ rating, reviews, size = "sm" }: ProductRatingProps) {
  const value = rating ?? 4.5;
  const filled = Math.round(value);
  const text = size === "md" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 ${text}`}
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      <span aria-hidden="true" className="tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "text-amber-500" : "text-slate-300"}>
            ★
          </span>
        ))}
      </span>
      <span className="text-xs text-slate-500">{value.toFixed(1)}</span>
      {typeof reviews === "number" && (
        <span className="text-xs text-slate-500">({reviews.toLocaleString("en-IN")})</span>
      )}
    </span>
  );
}
