import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onBack,
  showBackButton = true,
  className = '',
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center justify-between gap-3 py-2.5 px-3 rounded-xl border border-neutral-800/80 bg-neutral-900/50 backdrop-blur-md text-xs ${className}`}
    >
      {/* Breadcrumb Trail */}
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center">
          <button
            type="button"
            onClick={items[0]?.onClick}
            className="flex items-center gap-1 text-neutral-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
            title="Go to Home"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </li>

        {items.slice(1).map((item, index) => {
          const isLast = index === items.length - 2;
          return (
            <React.Fragment key={index}>
              <ChevronRight className="h-3 w-3 text-neutral-600 shrink-0" />
              <li className="flex items-center max-w-[200px] sm:max-w-xs truncate">
                {isLast || item.active ? (
                  <span className="font-semibold text-white truncate" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-neutral-400 hover:text-emerald-400 transition-colors truncate cursor-pointer"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      {/* Back Button */}
      {showBackButton && onBack && (
        <button
          type="button"
          onClick={onBack}
          id="nav-back-button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 hover:border-neutral-600 px-2.5 py-1 text-[11px] font-semibold text-neutral-200 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
          <span>Back</span>
        </button>
      )}
    </nav>
  );
};
