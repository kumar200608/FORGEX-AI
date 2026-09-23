import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatINR, formatINRNumber } from '../lib/currency';
import { IndianRupee, RotateCcw, Sliders, Check } from 'lucide-react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  step?: number;
  totalProductsCount?: number;
  filteredProductsCount?: number;
}

interface PricePreset {
  label: string;
  min: number;
  max: number;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 500,
  totalProductsCount,
  filteredProductsCount,
}) => {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const [minInputStr, setMinInputStr] = useState(value[0].toString());
  const [maxInputStr, setMaxInputStr] = useState(value[1].toString());

  // Sync when external props change
  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
    setMinInputStr(value[0].toString());
    setMaxInputStr(value[1].toString());
  }, [value]);

  const presets: PricePreset[] = useMemo(
    () => [
      { label: 'All Segments', min, max },
      { label: '< ₹15,000 (Budget)', min, max: Math.min(15000, max) },
      { label: '₹15k – ₹50k (Mid-range)', min: 15000, max: Math.min(50000, max) },
      { label: '₹50k – ₹1,00,000 (Premium)', min: 50000, max: Math.min(100000, max) },
      { label: '₹1,00,000+ (Flagship)', min: 100000, max },
    ],
    [min, max]
  );

  const isRangeCustomized = value[0] > min || value[1] < max;

  const minPercent = useMemo(() => {
    return Math.max(0, Math.min(100, ((localMin - min) / (max - min)) * 100));
  }, [localMin, min, max]);

  const maxPercent = useMemo(() => {
    return Math.max(0, Math.min(100, ((localMax - min) / (max - min)) * 100));
  }, [localMax, min, max]);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(newMin);
    setMinInputStr(newMin.toString());
    onChange([newMin, localMax]);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(newMax);
    setMaxInputStr(newMax.toString());
    onChange([localMin, newMax]);
  };

  const handleMinInputBlur = () => {
    let num = parseInt(minInputStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < min) num = min;
    if (num > localMax - step) num = localMax - step;
    setLocalMin(num);
    setMinInputStr(num.toString());
    onChange([num, localMax]);
  };

  const handleMaxInputBlur = () => {
    let num = parseInt(maxInputStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num > max) num = max;
    if (num < localMin + step) num = localMin + step;
    setLocalMax(num);
    setMaxInputStr(num.toString());
    onChange([localMin, num]);
  };

  const handleApplyPreset = (preset: PricePreset) => {
    const clampedMin = Math.max(min, preset.min);
    const clampedMax = Math.min(max, preset.max);
    setLocalMin(clampedMin);
    setLocalMax(clampedMax);
    setMinInputStr(clampedMin.toString());
    setMaxInputStr(clampedMax.toString());
    onChange([clampedMin, clampedMax]);
  };

  const handleReset = () => {
    setLocalMin(min);
    setLocalMax(max);
    setMinInputStr(min.toString());
    setMaxInputStr(max.toString());
    onChange([min, max]);
  };

  return (
    <div
      id="custom-inr-price-segment-slider"
      className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-sm transition-all"
    >
      {/* Header with Title and Current Price Span */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Indian Rupee (₹) Price Segment Range</span>
              {isRangeCustomized && (
                <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono lowercase">
                  filtered
                </span>
              )}
            </h4>
            <p className="text-[11px] text-neutral-400">
              Drag the dual range handles or type custom boundary values
            </p>
          </div>
        </div>

        {/* Action: Reset when customized */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isRangeCustomized && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer bg-neutral-800/80 px-2 py-1 rounded-md border border-neutral-700"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to All</span>
            </button>
          )}

          <div className="rounded-lg bg-neutral-950 px-3 py-1 border border-neutral-800 font-mono text-xs">
            <span className="text-emerald-400 font-bold">{formatINR(localMin)}</span>
            <span className="text-neutral-500 mx-1.5">—</span>
            <span className="text-emerald-400 font-bold">{formatINR(localMax)}</span>
          </div>
        </div>
      </div>

      {/* Dual Range Slider Track */}
      <div className="relative pt-6 pb-4 px-2">
        {/* Visual Background Track */}
        <div className="relative h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
          {/* Active Highlighted Segment */}
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Native Range Inputs overlaying for accessible dual slider control */}
        <input
          type="range"
          id="inr-min-range-slider"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinSliderChange}
          className="pointer-events-none absolute inset-x-2 top-4 w-[calc(100%-16px)] h-2 appearance-none bg-transparent accent-emerald-400 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-950 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-950 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          aria-label="Minimum Indian Rupee price"
        />

        <input
          type="range"
          id="inr-max-range-slider"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxSliderChange}
          className="pointer-events-none absolute inset-x-2 top-4 w-[calc(100%-16px)] h-2 appearance-none bg-transparent accent-teal-400 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-950 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-950 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          aria-label="Maximum Indian Rupee price"
        />

        {/* Min / Max Tick Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mt-2">
          <span>Min: {formatINR(min)}</span>
          <span className="hidden sm:inline text-neutral-600">Mid-tier: {formatINR(Math.round((min + max) / 2))}</span>
          <span>Max: {formatINR(max)}</span>
        </div>
      </div>

      {/* Manual Numeric Inputs & Preset Segment Chips */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-3 border-t border-neutral-800/80">
        {/* Min & Max Inputs */}
        <div className="md:col-span-5 flex items-center gap-2">
          <div className="flex-1 relative">
            <label htmlFor="min-price-input" className="block text-[10px] font-mono text-neutral-400 mb-1">
              From (₹ Min)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                ₹
              </span>
              <input
                type="text"
                id="min-price-input"
                value={minInputStr}
                onChange={(e) => setMinInputStr(e.target.value)}
                onBlur={handleMinInputBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleMinInputBlur()}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-6 pr-2 py-1.5 text-xs font-mono text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <span className="text-neutral-500 self-end pb-2 font-mono text-xs">—</span>

          <div className="flex-1 relative">
            <label htmlFor="max-price-input" className="block text-[10px] font-mono text-neutral-400 mb-1">
              To (₹ Max)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                ₹
              </span>
              <input
                type="text"
                id="max-price-input"
                value={maxInputStr}
                onChange={(e) => setMaxInputStr(e.target.value)}
                onBlur={handleMaxInputBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleMaxInputBlur()}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-6 pr-2 py-1.5 text-xs font-mono text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Indian Segment Buttons */}
        <div className="md:col-span-7 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
          <span className="text-[10px] font-mono text-neutral-500 mr-1 w-full sm:w-auto">
            Quick Segments:
          </span>
          {presets.map((preset) => {
            const isSelected =
              Math.abs(localMin - preset.min) < 500 && Math.abs(localMax - preset.max) < 500;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
