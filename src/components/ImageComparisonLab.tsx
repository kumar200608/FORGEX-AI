import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { ImageQualityStrategy } from '../types';
import { Sliders, Sparkles, Download, Check, ShieldCheck, Zap } from 'lucide-react';

interface ImageComparisonLabProps {
  currentStrategy: ImageQualityStrategy;
}

export const ImageComparisonLab: React.FC<ImageComparisonLabProps> = ({ currentStrategy }) => {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [compareMode, setCompareMode] = useState<'slider' | 'side-by-side'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTierOverride, setActiveTierOverride] = useState<'4k' | '1200' | '600' | '300'>('600');

  const product = PRODUCTS[selectedProductIndex];

  // Calculated transfer statistics
  const tiers = {
    '4k': {
      width: '3840px',
      label: '5G Lossless 4K Master (3840px)',
      estBytes: 1450000,
      format: 'Lossless WebP / AVIF (95% Quality)',
      clsRisk: 'Instant on 5G Gigabit (10ms)',
      loadTime5G: '0.04s',
      loadTime3G: '12.8s',
      src: product.images.ultra4k || product.images.high,
      badge: '⚡ 5G ULTRA HD',
    },
    '1200': {
      width: '1200px',
      label: 'Desktop Full-Res (1200px)',
      estBytes: 420000,
      format: 'WebP / JPEG (85% Quality)',
      clsRisk: 'High on 3G (reflow delay)',
      loadTime5G: '0.01s',
      loadTime3G: '3.4s',
      src: product.images.high,
      badge: '4G High-Res',
    },
    '600': {
      width: '600px',
      label: 'Balanced Adaptive (600px)',
      estBytes: 95000,
      format: 'WebP (70% Quality)',
      clsRisk: 'Protected via CSS Aspect-Ratio',
      loadTime5G: '<0.01s',
      loadTime3G: '0.8s',
      src: product.images.medium,
      badge: 'Standard 4G',
    },
    '300': {
      width: '300px',
      label: 'Lite High-Compression (300px)',
      estBytes: 24000,
      format: 'WebP (50% Quality)',
      clsRisk: 'Zero (Immediate placeholder)',
      loadTime5G: '<0.01s',
      loadTime3G: '0.2s',
      src: product.images.low,
      badge: '3G / 2G Lite',
    },
  };

  const baselineBytes = tiers['4k'].estBytes;
  const currentBytes = tiers[activeTierOverride].estBytes;
  const savedPercent = Math.round(((baselineBytes - currentBytes) / baselineBytes) * 100);
  const savedKb = Math.round((baselineBytes - currentBytes) / 1024);

  return (
    <section id="image-comparison-lab" className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-mono border border-emerald-500/30">
              Interactive Image & 5G Telemetry
            </span>
            <span className="rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-0.5 text-[10px] font-mono border border-amber-500/30 font-bold">
              ⚡ 5G + 4K UHD Lossless Mode Supported
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Active Strategy: <strong className="text-white uppercase">{currentStrategy}</strong>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Dynamic Image Compression & 4K Visual Fidelity Lab
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Compare crystal-clear 4K UHD master imagery on 5G networks against adaptive 1200px, 600px, and 300px tiers. AdaptX optimizes payload size dynamically while unlocking uncompressed 4K on gigabit connections.
          </p>
        </div>

        {/* Product Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="product-comparison-select" className="text-xs text-neutral-400 font-mono">
            Sample:
          </label>
          <select
            id="product-comparison-select"
            value={selectedProductIndex}
            onChange={(e) => setSelectedProductIndex(Number(e.target.value))}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            {PRODUCTS.map((p, idx) => (
              <option key={p.id} value={idx}>
                {p.name} {p.is5G ? '⚡ 5G' : ''} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode and Tier Switcher */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-mono">View Mode:</span>
          <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setCompareMode('side-by-side')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                compareMode === 'side-by-side' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Side-by-Side (4 Tiers)
            </button>
            <button
              type="button"
              onClick={() => setCompareMode('slider')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                compareMode === 'slider' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              4K vs 300px Split-Screen Lens
            </button>
          </div>
        </div>

        {/* Live Byte Delta Banner */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 font-mono text-xs text-emerald-300">
          <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Active Tier Payload: <strong>{Math.round(currentBytes / 1024)} KB</strong> (
            <strong className="text-emerald-400">{savedPercent > 0 ? `-${savedPercent}% vs 4K` : '4K Master Baseline'}</strong> /{' '}
            {savedKb > 0 ? `Saved ~${savedKb} KB` : 'Full 4K Payload'})
          </span>
        </div>
      </div>

      {/* VIEW: SIDE-BY-SIDE 4 TIERS */}
      {compareMode === 'side-by-side' ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 4K UHD Tier */}
          <div
            onClick={() => setActiveTierOverride('4k')}
            className={`rounded-2xl border p-4 transition-all cursor-pointer ${
              activeTierOverride === '4k'
                ? 'border-amber-400/80 bg-neutral-950/90 ring-2 ring-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-amber-300" />
                4K Ultra HD
              </span>
              <span className="font-mono text-amber-300/80 font-bold">~1.45 MB</span>
            </div>
            <div className="mt-3 aspect-4/3 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 relative group">
              <img
                src={tiers['4k'].src}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <span className="absolute top-2 right-2 rounded bg-amber-500/90 text-neutral-950 px-1.5 py-0.5 text-[9px] font-black font-mono">
                3840px
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>5G Load Time:</span>
                <span className="text-emerald-400 font-bold">{tiers['4k'].loadTime5G}</span>
              </div>
              <div className="flex justify-between">
                <span>3G Load Time:</span>
                <span className="text-rose-400 font-bold">{tiers['4k'].loadTime3G}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Tier:</span>
                <span className="text-amber-300 font-bold">5G Gigabit / Fiber</span>
              </div>
            </div>
          </div>

          {/* 1200px Tier */}
          <div
            onClick={() => setActiveTierOverride('1200')}
            className={`rounded-2xl border p-4 transition-all cursor-pointer ${
              activeTierOverride === '1200'
                ? 'border-neutral-400 bg-neutral-950/90 ring-2 ring-neutral-700'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs">
              <span className="font-bold text-white">1200px Full-Res</span>
              <span className="font-mono text-neutral-400">~420 KB</span>
            </div>
            <div className="mt-3 aspect-4/3 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
              <img
                src={tiers['1200'].src}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>4G Load Time:</span>
                <span className="text-emerald-400 font-bold">0.4s</span>
              </div>
              <div className="flex justify-between">
                <span>3G Load Time:</span>
                <span className="text-rose-400 font-bold">{tiers['1200'].loadTime3G}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Tier:</span>
                <span className="text-neutral-300">Fast 4G LTE</span>
              </div>
            </div>
          </div>

          {/* 600px Tier */}
          <div
            onClick={() => setActiveTierOverride('600')}
            className={`rounded-2xl border p-4 transition-all cursor-pointer ${
              activeTierOverride === '600'
                ? 'border-emerald-500 bg-neutral-950/90 ring-2 ring-emerald-500/30'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs">
              <span className="font-bold text-emerald-400">600px Standard</span>
              <span className="font-mono text-emerald-400 font-bold">~95 KB</span>
            </div>
            <div className="mt-3 aspect-4/3 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
              <img
                src={tiers['600'].src}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>3G Load Time:</span>
                <span className="text-emerald-400 font-bold">{tiers['600'].loadTime3G}</span>
              </div>
              <div className="flex justify-between">
                <span>Payload Reduction:</span>
                <span className="text-emerald-400 font-bold">-93% vs 4K</span>
              </div>
              <div className="flex justify-between">
                <span>Network Tier:</span>
                <span className="text-neutral-300">Standard 4G / 3G</span>
              </div>
            </div>
          </div>

          {/* 300px Tier */}
          <div
            onClick={() => setActiveTierOverride('300')}
            className={`rounded-2xl border p-4 transition-all cursor-pointer ${
              activeTierOverride === '300'
                ? 'border-teal-500 bg-neutral-950/90 ring-2 ring-teal-500/30'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs">
              <span className="font-bold text-teal-300">300px Lite</span>
              <span className="font-mono text-teal-300 font-bold">~24 KB</span>
            </div>
            <div className="mt-3 aspect-4/3 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
              <img
                src={tiers['300'].src}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>3G Load Time:</span>
                <span className="text-teal-300 font-bold">{tiers['300'].loadTime3G}</span>
              </div>
              <div className="flex justify-between">
                <span>Payload Reduction:</span>
                <span className="text-teal-300 font-bold">-98.3% vs 4K</span>
              </div>
              <div className="flex justify-between">
                <span>Network Tier:</span>
                <span className="text-neutral-300">Slow 3G / 2G / Saver</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: INTERACTIVE SPLIT-SCREEN SLIDER */
        <div className="mt-6 space-y-4">
          <div className="relative aspect-16/9 w-full max-w-3xl mx-auto overflow-hidden rounded-2xl border border-neutral-800 bg-black select-none">
            {/* Background Image: 300px Low-res */}
            <img
              src={tiers['300'].src}
              alt="Low Resolution"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute top-3 left-3 rounded-md bg-black/75 backdrop-blur-sm px-2 py-1 text-[11px] font-mono text-teal-300 border border-teal-500/30">
              Left: 300px Lite (~24 KB)
            </div>

            {/* Foreground Image: 4K UHD Master with clip-path */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
            >
              <img
                src={tiers['4k'].src}
                alt="4K Ultra HD Resolution"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 right-3 rounded-md bg-black/80 backdrop-blur-sm px-2 py-1 text-[11px] font-mono text-amber-300 border border-amber-500/40 font-bold">
                Right: 4K UHD Master (~1.45 MB)
              </div>
            </div>

            {/* Draggable Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-neutral-900 border-2 border-amber-400 flex items-center justify-center text-[10px] text-amber-300 font-bold shadow-lg">
                ⇄
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto flex items-center gap-3">
            <span className="text-[11px] font-mono text-teal-400">300px Lite</span>
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="flex-1 accent-amber-400 cursor-ew-resize"
            />
            <span className="text-[11px] font-mono text-amber-300 font-bold">4K UHD Master</span>
          </div>
        </div>
      )}
    </section>
  );
};
