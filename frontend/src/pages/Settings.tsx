import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, type Theme } from '../store/settingsStore';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, settings, updateSettings } = useSettingsStore();
  const { toasts, toast, removeToast } = useToast();

  const [deleteInput, setDeleteInput] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Unable to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    // UI-only — no real backend
    toast.info('Account deletion is not available in this demo.');
    setDeleteInput('');
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-[#0e0e10]">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white px-6 py-5 dark:border-zinc-800/80 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow label="Theme" description="Choose your preferred color scheme.">
            <div className="flex gap-2">
              {THEMES.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-medium transition-all',
                    theme === value
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Account */}
        <Section title="Account">
          <SettingRow label="Email" description="Your account email address.">
            <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
              {user?.email ?? '—'}
            </span>
          </SettingRow>
          <SettingRow label="Name" description="Your display name.">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user?.name ?? '—'}
            </span>
          </SettingRow>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <SettingRow
            label="Local search"
            description="Search note content locally on your device, not via the server."
          >
            <Toggle
              value={settings.localSearch}
              onChange={(v) => { updateSettings({ localSearch: v }); toast.success(v ? 'Local search enabled.' : 'Local search disabled.'); }}
            />
          </SettingRow>
          <SettingRow
            label="Auto-lock"
            description="Automatically lock the app after inactivity."
          >
            <Toggle
              value={settings.autoLock}
              onChange={(v) => { updateSettings({ autoLock: v }); toast.success(v ? 'Auto-lock enabled.' : 'Auto-lock disabled.'); }}
            />
          </SettingRow>
          <SettingRow
            label="Session timeout"
            description="How long before the session auto-expires."
          >
            <select
              value={settings.sessionTimeout}
              onChange={(e) => updateSettings({ sessionTimeout: Number(e.target.value) })}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {[15, 30, 60, 120, 480].map((m) => (
                <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m / 60 > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </SettingRow>
        </Section>

        {/* Session */}
        <Section title="Session">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sign out</p>
                <p className="text-xs text-zinc-400 mt-0.5">You'll be returned to the login screen.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
              >
                {isLoggingOut ? '' : 'Log out'}
              </Button>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-200 bg-white overflow-hidden dark:border-red-900/50 dark:bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-red-100 px-5 py-4 dark:border-red-900/30">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Delete account</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Permanently delete your SecureNotes account and all associated data. This cannot be undone.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Type <code className="font-mono font-bold text-zinc-700 dark:text-zinc-300">DELETE</code> to confirm:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm account deletion"
                className="h-9 w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              />
              <Button
                variant="danger"
                size="sm"
                disabled={deleteInput !== 'DELETE'}
                onClick={handleDeleteAccount}
              >
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ─── Shared layout components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</div>
    </div>
  );
}

function SettingRow({
  label, description, children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-200',
        value ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
