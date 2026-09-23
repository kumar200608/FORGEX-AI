import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#0f0c29] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 p-8 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">
            adaptive<span className="text-orange-400">.in</span>
          </p>
          <p className="mt-2 text-sm">
            Network- and device-adaptive storefront. Ships a light experience on slow
            networks and the full experience when the connection allows it.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Demo controls</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/?forceMode=FULL" className="motion-safe:transition-colors hover:text-white">
                <code>?forceMode=FULL</code>
              </Link>
            </li>
            <li>
              <Link href="/?forceMode=CONSTRAINED" className="motion-safe:transition-colors hover:text-white">
                <code>?forceMode=CONSTRAINED</code>
              </Link>
            </li>
            <li>
              <Link href="/performance" className="motion-safe:transition-colors hover:text-white">
                <code>Performance Lab</code>
              </Link>
            </li>
            <li>
              <Link href="/lab" className="motion-safe:transition-colors hover:text-white">
                <code>/lab (legacy)</code>
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Signals</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Network API</li>
            <li>probe</li>
            <li>device</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-8 py-4 text-xs">
          Adaptive Web Delivery — WA-5 demo. Placeholder images.
        </p>
      </div>
    </footer>
  );
}
