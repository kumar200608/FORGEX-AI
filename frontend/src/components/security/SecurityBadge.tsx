import { ShieldCheck, Shield } from 'lucide-react';
import type { NoteSecurityStatus } from '../../types';
import { cn } from '../../lib/utils';

interface SecurityBadgeProps {
  status: NoteSecurityStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const config: Record<
  NoteSecurityStatus,
  { label: string; icon: typeof Shield; classes: string; iconColor: string }
> = {
  unencrypted: {
    label: 'Encryption active (AES-256)',
    icon: ShieldCheck,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    iconColor: 'text-emerald-500',
  },
  'encryption-ready': {
    label: 'Encryption architecture ready',
    icon: ShieldCheck,
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50',
    iconColor: 'text-indigo-500',
  },
  encrypted: {
    label: 'End-to-end encrypted',
    icon: ShieldCheck,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    iconColor: 'text-emerald-500',
  },
};

export function SecurityBadge({ status, size = 'sm', className }: SecurityBadgeProps) {
  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        c.classes,
        className
      )}
      title={c.label}
    >
      <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', c.iconColor)} />
      {c.label}
    </span>
  );
}
