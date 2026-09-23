import { NavLink } from 'react-router-dom';
import { FileText, Users, Shield, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileNav = [
  { to: '/app/notes', icon: FileText, label: 'Notes' },
  { to: '/app/shared', icon: Users, label: 'Shared' },
  { to: '/app/security', icon: Shield, label: 'Security' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center justify-around px-2">
        {mobileNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                  isActive && 'bg-indigo-50 dark:bg-indigo-950/50'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
