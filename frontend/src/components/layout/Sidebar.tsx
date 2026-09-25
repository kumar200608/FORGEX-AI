import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, Users, Shield, Settings, LogOut, Lock, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { cn } from '../../lib/utils';

const navItems = [
  { section: 'NOTES', items: [
    { to: '/app/notes', icon: FileText, label: 'My Notes' },
    { to: '/app/shared', icon: Users, label: 'Shared with me' },
  ]},
  { section: 'SECURITY', items: [
    { to: '/app/security', icon: Shield, label: 'Security' },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ]},
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, getResolvedTheme } = useSettingsStore();
  const navigate = useNavigate();

  const isDark = getResolvedTheme() === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex h-screen w-60 shrink-0 flex-col border-r border-zinc-100 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Lock className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          SecureNotes
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navItems.map(({ section, items }) => (
          <div key={section}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-zinc-100 px-3 py-4 dark:border-zinc-800/80 space-y-0.5">
        {user && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
              {user.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="h-4 w-4 shrink-0 text-amber-500" /> : <Moon className="h-4 w-4 shrink-0 text-indigo-500" />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </div>
          <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
            {theme}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
