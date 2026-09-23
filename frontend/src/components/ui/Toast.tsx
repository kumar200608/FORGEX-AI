import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { Toast, ToastVariant } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
  info: <Info className="h-4 w-4 text-indigo-500 shrink-0" />,
};

const styles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 dark:border-emerald-900/50',
  error: 'border-red-200 dark:border-red-900/50',
  info: 'border-indigo-200 dark:border-indigo-900/50',
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg',
        'dark:bg-zinc-900',
        'min-w-[260px] max-w-sm',
        styles[toast.variant]
      )}
    >
      {icons[toast.variant]}
      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
