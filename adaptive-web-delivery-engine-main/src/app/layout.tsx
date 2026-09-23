import type { Metadata } from "next";
import { AdaptiveModeProvider } from "@/context/AdaptiveModeContext";
import { CartProvider } from "@/context/CartContext";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import "./globals.css";
export const metadata: Metadata = { title: "Adaptive Web Delivery Demo", description: "Network- and device-adaptive e-commerce demo (WA-5)" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="bg-stone-100 text-slate-900 antialiased"><AdaptiveModeProvider><CartProvider><SiteNav />{children}<Footer /></CartProvider></AdaptiveModeProvider></body></html>);
}
