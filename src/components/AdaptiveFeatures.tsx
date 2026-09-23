import React, { useState, useEffect } from 'react';
import { JsTier, Product } from '../types';
import { Sparkles, Shield, Cpu, RotateCw, CheckCircle, Info } from 'lucide-react';

interface Enhanced3DInspectorProps {
  product: Product;
}

export const Enhanced3DInspector: React.FC<Enhanced3DInspectorProps> = ({ product }) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeSensors, setActiveSensors] = useState(true);

  return (
    <div
      id="enhanced-3d-inspector"
      className="mt-4 rounded-2xl border border-emerald-500/30 bg-neutral-900/60 p-4 backdrop-blur-md"
    >
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Enhanced Tier: Interactive Vector Diagnostics
          </h4>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          JS ENHANCED ONLY
        </span>
      </div>

      <div className="py-4 text-center">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-950/10 transition-transform duration-200">
          {/* Simulated radar/360 rotation */}
          <div
            className="absolute inset-2 rounded-full border border-dashed border-emerald-500/40 transition-transform duration-300"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          />
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400 font-mono">{rotationAngle}°</div>
            <div className="text-[10px] text-neutral-400">Rotational Plane</div>
          </div>
        </div>

        <div className="mt-4 flex justify-center items-center gap-3">
          <button
            type="button"
            onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-emerald-400" />
            <span>Rotate 45°</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSensors(!activeSensors)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              activeSensors
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-neutral-700 bg-neutral-800 text-neutral-400'
            }`}
          >
            {activeSensors ? 'Telemetry Active' : 'Telemetry Paused'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 text-center">
        Loaded dynamically because device has high concurrency and network bandwidth is unconstrained.
      </p>
    </div>
  );
};

interface StandardQuickCompareProps {
  product: Product;
}

export const StandardQuickCompare: React.FC<StandardQuickCompareProps> = ({ product }) => {
  return (
    <div
      id="standard-specs-module"
      className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5"
    >
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-xs font-semibold text-neutral-200">Hardware Specifications</span>
        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
          STANDARD & ENHANCED
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(product.specs).map(([key, value]) => (
          <div key={key} className="rounded bg-neutral-950/60 p-2 border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 block truncate">{key}</span>
            <span className="font-mono text-neutral-300 font-medium text-xs block truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LiteNoticeProps {
  reason?: string;
}

export const LiteNotice: React.FC<LiteNoticeProps> = ({ reason }) => {
  return (
    <div
      id="lite-mode-notice"
      className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5"
    >
      <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
      <div>
        <span className="font-bold block">JS Tier: LITE</span>
        <p className="text-[11px] text-amber-300/80 mt-0.5">
          Heavy 3D interactors and animated canvases were omitted to conserve main thread CPU execution and memory on your device.
        </p>
        {reason && <p className="text-[10px] font-mono text-amber-400 mt-1">{reason}</p>}
      </div>
    </div>
  );
};
