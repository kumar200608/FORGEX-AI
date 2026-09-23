import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout, AuthGuard } from './components/layout/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Notes from './pages/Notes';
import NoteEditor from './pages/NoteEditor';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Shared from './pages/Shared';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.style.colorScheme = resolved;
  }, [theme]);

  // Also listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      const res = e.matches ? 'dark' : 'light';
      if (res === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      root.style.colorScheme = res;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return <>{children}</>;
}

export default function App() {
  const { hydrateSession } = useAuthStore();

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />
          <Route path="/signup" element={<AuthGuard><Signup /></AuthGuard>} />

          {/* Protected app */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/notes" replace />} />
            <Route path="notes" element={<Notes />} />
            <Route path="notes/:id" element={<NoteEditor />} />
            <Route path="shared" element={<Shared />} />
            <Route path="security" element={<Security />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
