import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface Settings {
  localSearch: boolean;
  autoLock: boolean;
  sessionTimeout: number; // minutes
}

interface SettingsStore {
  theme: Theme;
  settings: Settings;

  setTheme: (theme: Theme) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  getResolvedTheme: () => 'light' | 'dark';
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      settings: {
        localSearch: true,
        autoLock: true,
        sessionTimeout: 30,
      },

      setTheme: (theme) => set({ theme }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      getResolvedTheme: () => {
        const { theme } = get();
        if (theme !== 'system') return theme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      },
    }),
    { name: 'securenotes-v2-settings' }
  )
);
