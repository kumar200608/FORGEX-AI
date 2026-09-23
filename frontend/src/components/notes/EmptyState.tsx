import { FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">
        {icon ?? <FileText className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-400 dark:text-zinc-500">{description}</p>
      {action && (
        <Button
          variant="primary"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
