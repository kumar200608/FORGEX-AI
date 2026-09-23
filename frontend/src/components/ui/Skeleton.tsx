import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800',
        className
      )}
    />
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function NoteSkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  );
}
