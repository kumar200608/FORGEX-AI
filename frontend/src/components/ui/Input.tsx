import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all',
            'bg-white text-zinc-900 placeholder:text-zinc-400',
            'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500',
            'border-zinc-200 dark:border-zinc-700',
            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            leftIcon ? 'pl-9' : undefined,
            rightIcon ? 'pr-9' : undefined,
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
