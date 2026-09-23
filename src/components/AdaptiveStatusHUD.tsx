import React from 'react';
import {
  Activity,
  Wifi,
  Cpu,
  Image as ImageIcon,
  Zap,
  Layers,
  Sparkles,
  ChevronDown,
  Gauge,
  WifiOff,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { AdaptiveProfile, DeviceProfile, NetworkProfile, SimulationPreset, ThemeMode } from '../types';

interface AdaptiveStatusHUDProps {
  network: NetworkProfile;
  device: DeviceProfile;
  adaptive: AdaptiveProfile;
  simulationPreset: SimulationPreset;
  onSelectSimulation: (preset: SimulationPreset) => void;
  onOpenDashboard: () => void;
  activeRoute: string;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const AdaptiveStatusHUD: React.FC<AdaptiveStatusHUDProps> = ({
  network,
  device,
  adaptive,
  simulationPreset,
  onSelectSimulation,
  onOpenDashboard,
  activeRoute,
  theme = 'night',
  onToggleTheme,
}) => {
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'ENHANCED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'STANDARD':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'LITE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OFFLINE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const getModeDot = (mode: string) => {
    switch (mode) {
      case 'ENHANCED':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
      case 'STANDARD':
        return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
      case 'LITE':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
      case 'OFFLINE':
        return 'bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]';
      default:
        return 'bg-neutral-400';
    }
  };

  return (
    <aside
      id="adaptx-status-hud"
      aria-label="AdaptX Adaptive Telemetry and Simulation Control"
      className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-3 py-2 text-xs transition-colors"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5">
        {/* Left: Brand + Adaptive Mode badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-emerald-400 to-teal-600 text-neutral-950 font-black text-[11px]">
              AX
            </div>
            <span className="text-sm font-extrabold tracking-wider">ADAPTX</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold transition-all ${getModeColor(
              adaptive.mode
            )}`}
          >
            <span className={`h-2 w-2 rounded-full animate-pulse ${getModeDot(adaptive.mode)}`} />
            <span>{adaptive.mode} MODE</span>
          </div>

          {adaptive.isSimulated && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              Demo Simulation Active
            </span>
          )}
        </div>

        {/* Center: Real-time Telemetry Indicators */}
        <div className="hidden lg:flex items-center gap-4 font-mono text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5" title={`Effective Type: ${network.effectiveType}, Downlink: ${network.downlinkMb}Mbps, RTT: ${network.rttMs}ms`}>
            {network.isOnline ? (
              <Wifi className={`h-3.5 w-3.5 ${network.effectiveType === '5g' || network.classification === 'ULTRA_FAST' ? 'text-amber-400' : 'text-neutral-400'}`} />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span>Network:</span>
            <span className={`font-semibold ${network.effectiveType === '5g' || network.classification === 'ULTRA_FAST' ? 'text-amber-300 font-bold' : 'text-neutral-200'}`}>
              {network.classification === 'ULTRA_FAST' ? '⚡ ULTRA 5G' : network.classification} ({network.effectiveType.toUpperCase()})
            </span>
          </div>

          <span className="text-neutral-700">|</span>

          <div className="flex items-center gap-1.5" title={`Cores: ${device.hardwareConcurrency}, RAM: ${device.deviceMemoryGb || 'unknown'}GB`}>
            <Cpu className="h-3.5 w-3.5 text-neutral-400" />
            <span>Device:</span>
            <span className="font-semibold text-neutral-200">{device.classification}</span>
          </div>

          <span className="text-neutral-700">|</span>

          <div className="flex items-center gap-1.5" title={`Image Delivery Strategy: ${adaptive.imageStrategy}`}>
            <ImageIcon className={`h-3.5 w-3.5 ${adaptive.imageStrategy === 'ultra-4k' ? 'text-amber-400' : 'text-neutral-400'}`} />
            <span>Image:</span>
            <span className={`font-semibold ${adaptive.imageStrategy === 'ultra-4k' ? 'text-amber-300 font-bold' : 'text-neutral-200'}`}>
              {adaptive.imageStrategy === 'ultra-4k' ? '4K ULTRA HD' : adaptive.imageStrategy.toUpperCase()}
            </span>
          </div>

          <span className="text-neutral-700">|</span>

          <div className="flex items-center gap-1.5" title={`JavaScript Bundling Tier: ${adaptive.jsTier}`}>
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
            <span>JS:</span>
            <span className="font-semibold text-neutral-200">{adaptive.jsTier}</span>
          </div>

          <span className="text-neutral-700">|</span>

          <div className="flex items-center gap-1.5" title={`Prefetching Strategy: ${adaptive.prefetchStrategy}`}>
            <Zap className="h-3.5 w-3.5 text-neutral-400" />
            <span>Prefetch:</span>
            <span
              className={`font-semibold ${
                adaptive.prefetchStrategy === 'DISABLED'
                  ? 'text-rose-400'
                  : adaptive.prefetchStrategy === 'LIMITED'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {adaptive.prefetchStrategy}
            </span>
          </div>
        </div>

        {/* Right: Simulation Controller & Dashboard CTA */}
        <div className="flex items-center gap-2">
          {/* Quick Day / Night Toggle Pill */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              id="hud-theme-toggle-btn"
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                theme === 'day'
                  ? 'border-amber-400/60 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title={`Switch to ${theme === 'day' ? 'Night' : 'Day'} Mode`}
              aria-label={`Toggle theme, current is ${theme} mode`}
            >
              {theme === 'day' ? (
                <>
                  <Sun className="h-3 w-3 text-amber-600 fill-amber-400" />
                  <span className="hidden md:inline font-semibold">Day</span>
                </>
              ) : (
                <>
                  <Moon className="h-3 w-3 text-indigo-400 fill-indigo-400/30" />
                  <span className="hidden md:inline font-semibold">Night</span>
                </>
              )}
            </button>
          )}

          {/* Quick Simulation Select */}
          <div className="relative flex items-center">
            <label htmlFor="sim-select" className="sr-only">
              Simulate Network and Device
            </label>
            <select
              id="sim-select"
              value={simulationPreset}
              onChange={(e) => onSelectSimulation(e.target.value as SimulationPreset)}
              className="appearance-none rounded-lg border border-neutral-700 bg-neutral-900/90 pl-2.5 pr-7 py-1 text-[11px] font-mono text-neutral-200 hover:border-neutral-600 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="none">Detect Real Browser</option>
              <option value="fast-5g">⚡ 5G Ultra Gigabit • Radiant Glow (4K UHD)</option>
              <option value="fast-high">⚡ 4G Fast LTE • Lightly Glow (1200px)</option>
              <option value="moderate-med">📶 3G Medium • Fixed Standard (600px)</option>
              <option value="slow-low">📶 Slow 3G/2G • Fixed Standard (300px)</option>
              <option value="offline">🚫 Offline • Fixed Standard (Cache)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-neutral-400" />
          </div>

          {/* Diagnostics Dashboard Link */}
          {activeRoute !== 'dashboard' && (
            <button
              type="button"
              onClick={onOpenDashboard}
              id="hud-dashboard-btn"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Gauge className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vitals & AI</span>
              <span className="sm:hidden">Vitals</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
