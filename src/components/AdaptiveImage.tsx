import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ImageQualityStrategy } from '../types';
import { DownloadCloud, AlertCircle, Layers, Sparkles, Maximize2, Move, Eye } from 'lucide-react';

export interface GalleryItem {
  ultra4k?: string;
  high: string;
  medium: string;
  low: string;
  placeholder: string;
  caption?: string;
}

export interface AdaptiveImageProps {
  images: GalleryItem;
  gallery?: GalleryItem[];
  alt: string;
  strategy: ImageQualityStrategy;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  showBadge?: boolean;
  showGallerySelector?: boolean;
  enableHoverZoom?: boolean;
  enableLightbox?: boolean;
  activeGalleryIndex?: number;
  onGalleryIndexChange?: (idx: number) => void;
  onHoverPrefetch?: () => void;
  id?: string;
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  images,
  gallery,
  alt,
  strategy,
  priority = false,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-4/3',
  showBadge = true,
  showGallerySelector = true,
  enableHoverZoom = false,
  enableLightbox = false,
  activeGalleryIndex,
  onGalleryIndexChange,
  onHoverPrefetch,
  id,
}) => {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number>(0);
  const activeImageIndex = activeGalleryIndex !== undefined ? activeGalleryIndex : internalActiveIndex;

  const [manualResolution, setManualResolution] = useState<'default' | 'high' | 'ultra4k'>('default');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [is4KDetailView, setIs4KDetailView] = useState(false);

  // Hover-to-zoom state
  const [isHoveringZoom, setIsHoveringZoom] = useState(false);
  const [isLightboxHovering, setIsLightboxHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [zoomScale, setZoomScale] = useState<number>(2.5);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compile full image list: primary image + any gallery additions
  const allImages: GalleryItem[] = gallery && gallery.length > 0 ? gallery : [images];
  const currentSet = allImages[activeImageIndex] || allImages[0] || images;
  const ultra4kSrc = currentSet.ultra4k || currentSet.high;

  // Reset zoom state and loading indicator whenever the selected image changes
  useEffect(() => {
    setIsHoveringZoom(false);
    setZoomPos({ x: 50, y: 50 });
    setIsLoaded(false);
    setHasError(false);
    setIsZoomed(false);
  }, [activeImageIndex, currentSet.high, currentSet.ultra4k]);

  // Conditionally track when user initiates a zoom interaction
  const isZoomingActive = isHoveringZoom || isZoomed || isLightboxHovering || manualResolution === 'ultra4k';

  // Preload high-res 4K texture ONLY when user initiates a zoom interaction
  useEffect(() => {
    if (enableHoverZoom && isZoomingActive && ultra4kSrc) {
      const img = new Image();
      img.src = ultra4kSrc;
    }
  }, [enableHoverZoom, isZoomingActive, ultra4kSrc]);

  // Determine active standard URL strictly based on active profile strategy or user manual override
  let currentSrc = currentSet.medium;
  let resolutionLabel = '600px SD';
  let estimatedSavings = '~85 KB';
  let is4KActive = false;

  if (manualResolution === 'ultra4k' || (manualResolution === 'default' && strategy === 'ultra-4k')) {
    currentSrc = ultra4kSrc;
    resolutionLabel = '3840px 4K UHD';
    estimatedSavings = '1.8 MB (Lossless)';
    is4KActive = true;
  } else if (manualResolution === 'high' || (manualResolution === 'default' && strategy === 'high')) {
    currentSrc = currentSet.high;
    resolutionLabel = '1200px Full HD';
    estimatedSavings = '350 KB (-80%)';
  } else if (strategy === 'low' && manualResolution === 'default') {
    currentSrc = currentSet.low;
    if (currentSrc.includes('unsplash.com')) {
      currentSrc = currentSrc.replace(/q=\d+/, 'q=35').replace(/w=\d+/, 'w=300');
    }
    resolutionLabel = '300px Low-Res';
    estimatedSavings = '20 KB (-98%)';
  } else if (strategy === 'minimal' && manualResolution === 'default') {
    currentSrc = currentSet.placeholder;
    if (currentSrc.includes('unsplash.com')) {
      currentSrc = currentSrc.replace(/q=\d+/, 'q=20').replace(/w=\d+/, 'w=60');
    }
    resolutionLabel = '60px Pixelated';
    estimatedSavings = '2 KB (-99.9%)';
  } else {
    currentSrc = currentSet.medium;
    resolutionLabel = '600px SD';
    estimatedSavings = '85 KB (-95%)';
  }

  const handleSelectImage = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onGalleryIndexChange) {
      onGalleryIndexChange(idx);
    } else {
      setInternalActiveIndex(idx);
    }
    setIsLoaded(false);
    setIsHoveringZoom(false);
    setZoomPos({ x: 50, y: 50 });
  };

  // Calculate mouse position for smooth hover-to-zoom tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableHoverZoom || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setZoomPos({ x, y });
    },
    [enableHoverZoom]
  );

  const handleMouseEnter = () => {
    if (onHoverPrefetch) onHoverPrefetch();
    if (enableHoverZoom) setIsHoveringZoom(true);
  };

  const handleMouseLeave = () => {
    if (enableHoverZoom) {
      setIsHoveringZoom(false);
      setZoomPos({ x: 50, y: 50 });
    }
  };

  const lightboxPortal = isZoomed && enableLightbox && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-neutral-800 bg-neutral-900/90 gap-3">
              <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-300 min-w-0">
                <Layers className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white truncate max-w-xs">{alt}</span>
                <span className="text-neutral-600 hidden sm:inline">•</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-bold hidden sm:inline-flex shrink-0">
                  {is4KActive || manualResolution === 'ultra4k'
                    ? '⚡ 4K UHD Lossless Master'
                    : '1200px Full-Res'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* 4K Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setManualResolution((prev) => (prev === 'ultra4k' ? 'high' : 'ultra4k'));
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                    manualResolution === 'ultra4k' || is4KActive
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>
                    {manualResolution === 'ultra4k' || is4KActive ? '4K Active' : 'Switch to 4K'}
                  </span>
                </button>

                {/* 100% Pixel Inspection Loupe Toggle */}
                <button
                  type="button"
                  onClick={() => setIs4KDetailView(!is4KDetailView)}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                    is4KDetailView
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>{is4KDetailView ? 'Fit Screen' : '1:1 Pixel Inspect'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="rounded-xl p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Image Stage with Full 4K Pan/Zoom Inspection */}
            <div
              className="overflow-hidden flex-1 p-4 bg-neutral-950 flex items-center justify-center relative cursor-crosshair"
              onMouseEnter={() => setIsLightboxHovering(true)}
              onMouseLeave={() => {
                setIsLightboxHovering(false);
                setZoomPos({ x: 50, y: 50 });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                  setZoomPos({ x, y });
                }
              }}
            >
              <img
                src={currentSrc}
                alt={alt}
                style={{
                  transform: !is4KDetailView && isLightboxHovering ? 'scale(2.2)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  willChange: 'transform',
                  imageRendering: (strategy === 'low' || strategy === 'minimal') && manualResolution === 'default' ? 'pixelated' : 'auto',
                }}
                className={`transition-transform duration-100 ease-out select-none ${
                  is4KDetailView
                    ? 'max-w-none w-[180%] h-auto rounded-xl shadow-2xl cursor-grab'
                    : 'max-h-[72vh] max-w-full object-contain rounded-xl'
                }`}
              />

              <div
                className={`absolute top-3 left-3 pointer-events-none rounded-xl bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 text-[11px] font-mono text-neutral-300 backdrop-blur-md transition-opacity flex items-center gap-2 ${
                  isLightboxHovering ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Adaptive Texture Inspector • {resolutionLabel} ({estimatedSavings})</span>
              </div>
            </div>

            {/* Footer Telemetry */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-800/80 bg-neutral-900/60 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Source:{' '}
                <strong className="text-white">
                  {resolutionLabel} • {estimatedSavings}
                </strong>
              </span>
              <span className="text-neutral-500 hidden sm:inline">
                Hover or pan across image for sub-millimeter texture inspection
              </span>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <div
        id={id}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={onHoverPrefetch}
        className={`relative overflow-hidden rounded-xl bg-neutral-900 ${aspectRatio} group/img select-none ${
          enableHoverZoom ? 'cursor-crosshair' : ''
        } ${
          is4KActive ? 'ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''
        }`}
      >
        {/* Low-res blurred backdrop to avoid Layout Shift (CLS) */}
        {!isLoaded && !hasError && (
          <img
            src={currentSet.placeholder}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur-lg scale-105 opacity-60 pointer-events-none"
          />
        )}

        {/* Unified Hardware-Accelerated Image Layer */}
        {!hasError ? (
          <img
            key={`${currentSrc}-${activeImageIndex}`}
            src={currentSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            style={{
              ...(enableHoverZoom
                ? {
                    transform: isHoveringZoom ? `scale(${zoomScale})` : 'scale(1)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: isHoveringZoom
                      ? 'transform 0.06s ease-out'
                      : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'transform',
                  }
                : {}),
              imageRendering: (strategy === 'low' || strategy === 'minimal') && manualResolution === 'default' ? 'pixelated' : 'auto',
            }}
            className={`h-full w-full object-cover select-none ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-200 ${className}`}
            onClick={(e) => {
              if (enableLightbox) {
                e.stopPropagation();
                setIsZoomed(true);
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-neutral-500 bg-neutral-900/90">
            <AlertCircle className="h-6 w-6 text-neutral-600 mb-1" />
            <span className="text-xs">Offline / Image unavailable</span>
          </div>
        )}

        {/* Hover Zoom HUD telemetry overlay */}
        {enableHoverZoom && isLoaded && !hasError && isHoveringZoom && (
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2 rounded-xl bg-neutral-950/90 border border-emerald-500/40 px-2.5 py-1 backdrop-blur-md shadow-xl text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col text-[10px] font-mono leading-tight">
              <span className="font-bold text-emerald-300">4K TEXTURE ZOOM ({zoomScale}×)</span>
              <span className="text-neutral-400 text-[8.5px]">
                {Math.round(zoomPos.x)}%, {Math.round(zoomPos.y)}% • 3840px UHD
              </span>
            </div>
          </div>
        )}

        {/* 4K UHD Master Floating Badge (Top Right when not actively zooming) */}
        {is4KActive && isLoaded && !isHoveringZoom && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500/90 via-emerald-500/90 to-teal-500/90 px-2 py-0.5 text-[10px] font-mono font-black text-neutral-950 shadow-md backdrop-blur-md">
            <Sparkles className="h-3 w-3 fill-neutral-950" />
            <span>4K UHD MASTER</span>
          </div>
        )}

        {/* Hover Zoom & Texture Magnifier Controls for Detail View */}
        {enableHoverZoom && (
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-xl p-1 shadow-lg opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-mono font-bold text-neutral-400 px-1 hidden sm:flex items-center gap-0.5">
              <Move className="h-2.5 w-2.5 text-emerald-400" />
            </span>
            {[2.0, 2.8, 4.0].map((level) => (
              <button
                key={level}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(level);
                }}
                className={`rounded-lg px-1.5 py-0.5 text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                  zoomScale === level
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={`Set 4K Texture Zoom level to ${level}x`}
              >
                {level}×
              </button>
            ))}

            {/* Expand Fullscreen Lightbox Button */}
            {enableLightbox && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(true);
                }}
                className="ml-0.5 rounded-lg p-1 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Open full-screen 4K inspection lightbox"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Adaptive Delivery Info Pill & Resolution Switcher */}
        {showBadge && isLoaded && !isHoveringZoom && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-md bg-neutral-950/85 px-2 py-1 text-[10px] font-mono text-neutral-300 backdrop-blur-md border border-neutral-800/80 shadow-sm whitespace-nowrap max-w-[calc(100%-120px)] overflow-hidden">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                is4KActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className={`truncate ${is4KActive ? 'text-amber-300 font-bold' : ''}`}>{resolutionLabel}</span>
            <span className="text-neutral-600 hidden xs:inline">|</span>
            <span className={`hidden xs:inline ${is4KActive ? 'text-amber-300 font-bold' : 'text-emerald-400 font-semibold'}`}>
              {estimatedSavings}
            </span>

            {/* Quick 4K upgrade button */}
            {!is4KActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setManualResolution('ultra4k');
                  setIsLoaded(false);
                }}
                title="Force lossless 4K Ultra-HD resolution asset load"
                className="ml-1 flex items-center gap-0.5 rounded bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 hover:border-amber-400 px-1 py-0.5 text-[8.5px] font-bold text-amber-300 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>4K</span>
              </button>
            )}

            {strategy === 'low' && manualResolution === 'default' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setManualResolution('high');
                  setIsLoaded(false);
                }}
                title="Force full resolution asset load"
                className="ml-1 flex items-center gap-0.5 rounded bg-neutral-800 hover:bg-neutral-700 px-1 py-0.5 text-[9px] text-neutral-200 transition-colors cursor-pointer"
              >
                <DownloadCloud className="h-2.5 w-2.5" />
                <span>HD</span>
              </button>
            )}
          </div>
        )}

        {/* Caption Overlay if present */}
        {currentSet.caption && !isHoveringZoom && (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-neutral-950/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-neutral-300 border border-neutral-800">
            {currentSet.caption}
          </div>
        )}
      </div>

      {/* Multi-Angle Gallery Thumbnails with 4K Texture indicators */}
      {showGallerySelector && allImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allImages.map((img, idx) => {
            const isSelected = idx === activeImageIndex;
            const thumbSrc = strategy === 'low' ? img.low : img.medium || img.high;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleSelectImage(idx, e)}
                className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                    : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-700'
                }`}
                title={img.caption || `Angle ${idx + 1} (Click to inspect 4K texture)`}
              >
                <img
                  src={thumbSrc}
                  alt={img.caption || `Angle ${idx + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono text-emerald-400 text-center py-0.2">
                  Angle {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Render Lightbox via React Portal directly into body */}
      {lightboxPortal}
    </div>
  );
};
