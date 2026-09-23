import { useState, useEffect, useCallback } from 'react';
import { Camera, Mic, MapPin, ShieldAlert, RefreshCw } from 'lucide-react';
import { permissionManager } from '@/lib/permissions/permissionManager';

// ============================================================
// PermissionGate — Android APK Permission Request UI
//
// Shows a clear, actionable permission request overlay when
// camera, microphone, or geolocation access is needed.
//
// On Android TWA / PWA APK:
//   - First visit: tapping "Allow" triggers the native OS dialog
//   - If already denied: shows instructions to enable via Settings
// ============================================================

export type PermissionRequirement = 'camera' | 'microphone' | 'geolocation';

interface PermissionGateProps {
  require: PermissionRequirement[];
  onAllGranted?: () => void;
  children: React.ReactNode;
  /** Optional: show a banner instead of blocking the view */
  mode?: 'block' | 'banner';
}

interface PermState {
  camera: PermissionState | 'unknown' | 'idle';
  microphone: PermissionState | 'unknown' | 'idle';
  geolocation: PermissionState | 'unknown' | 'idle';
}

const PERM_INFO: Record<PermissionRequirement, {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  why: string;
}> = {
  camera: {
    icon: Camera,
    label: 'Camera',
    why: 'Used for QR asset scanning and before/after work evidence photos',
  },
  microphone: {
    icon: Mic,
    label: 'Microphone',
    why: 'Used for voice notes on field inspection checklist items',
  },
  geolocation: {
    icon: MapPin,
    label: 'Location',
    why: 'GPS coordinates are tagged on field evidence photos and work completion records',
  },
};

export default function PermissionGate({
  require,
  onAllGranted,
  children,
  mode = 'block',
}: PermissionGateProps) {
  const [states, setStates] = useState<PermState>({
    camera: 'idle',
    microphone: 'idle',
    geolocation: 'idle',
  });
  const [requesting, setRequesting] = useState<PermissionRequirement | null>(null);
  const [checked, setChecked] = useState(false);

  const checkAll = useCallback(async () => {
    const results: Partial<PermState> = {};
    for (const perm of require) {
      const state = await permissionManager.query(perm);
      results[perm] = state;
    }
    setStates((prev) => ({ ...prev, ...results }));
    setChecked(true);
  }, [require]);

  useEffect(() => {
    void checkAll();
  }, [checkAll]);

  const allGranted = checked && require.every(
    (p) => states[p] === 'granted'
  );

  useEffect(() => {
    if (allGranted) onAllGranted?.();
  }, [allGranted, onAllGranted]);

  const requestPermission = async (perm: PermissionRequirement) => {
    setRequesting(perm);
    try {
      let granted = false;
      if (perm === 'camera') granted = await permissionManager.requestCamera();
      else if (perm === 'microphone') granted = await permissionManager.requestMicrophone();
      else if (perm === 'geolocation') {
        const pos = await permissionManager.requestGeolocation();
        granted = pos !== null;
      }
      setStates((prev) => ({
        ...prev,
        [perm]: granted ? 'granted' : 'denied',
      }));
    } finally {
      setRequesting(null);
    }
  };

  const requestAll = async () => {
    for (const perm of require) {
      if (states[perm] !== 'granted') {
        await requestPermission(perm);
      }
    }
  };

  // If all required permissions are granted, render children
  if (allGranted) return <>{children}</>;

  // Banner mode — render children but show a dismissible warning bar
  if (mode === 'banner') {
    const denied = require.filter((p) => states[p] === 'denied');
    const needing = require.filter((p) => states[p] === 'prompt' || states[p] === 'unknown' || states[p] === 'idle');
    if (denied.length === 0 && needing.length === 0) return <>{children}</>;

    return (
      <div>
        <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900">
              {denied.length > 0 ? 'Permissions Denied' : 'Permissions Required'}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {denied.length > 0
                ? `${denied.map((p) => PERM_INFO[p].label).join(', ')} access was denied. Enable in Android Settings → Apps → FieldSync → Permissions.`
                : `Tap "Allow" to enable ${needing.map((p) => PERM_INFO[p].label).join(', ')} for full functionality.`}
            </p>
          </div>
          {needing.length > 0 && (
            <button
              onClick={requestAll}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition-colors"
            >
              Allow
            </button>
          )}
        </div>
        {children}
      </div>
    );
  }

  // Block mode — full overlay
  const denied = require.filter((p) => states[p] === 'denied');
  const needingPrompt = require.filter(
    (p) => states[p] === 'prompt' || states[p] === 'unknown' || states[p] === 'idle'
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center">
        <ShieldAlert size={32} className="text-indigo-600" />
      </div>

      <div>
        <h3 className="text-base font-bold text-zinc-900">
          {denied.length > 0 ? 'Permissions Blocked' : 'Permissions Required'}
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          {denied.length > 0
            ? 'Some permissions were denied. To re-enable, go to:'
            : 'FieldSync needs the following permissions to work in field:'}
        </p>
        {denied.length > 0 && (
          <p className="text-[11px] font-bold text-rose-600 mt-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
            Android Settings → Apps → FieldSync → Permissions
          </p>
        )}
      </div>

      {/* Permission list */}
      <div className="w-full max-w-xs space-y-2">
        {require.map((perm) => {
          const info = PERM_INFO[perm];
          const Icon = info.icon;
          const state = states[perm];
          const isGranted = state === 'granted';
          const isDenied = state === 'denied';

          return (
            <div
              key={perm}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left ${
                isGranted
                  ? 'bg-emerald-50 border-emerald-200'
                  : isDenied
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isGranted
                    ? 'bg-emerald-100 text-emerald-600'
                    : isDenied
                    ? 'bg-rose-100 text-rose-500'
                    : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900">{info.label}</p>
                <p className="text-[10px] text-zinc-500 line-clamp-1">{info.why}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isGranted
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : isDenied
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                }`}
              >
                {isGranted ? '✓ Granted' : isDenied ? '✗ Denied' : 'Needed'}
              </span>
            </div>
          );
        })}
      </div>

      {needingPrompt.length > 0 && (
        <button
          onClick={requestAll}
          disabled={requesting !== null}
          className="w-full max-w-xs h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-60 transition-all"
        >
          {requesting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <ShieldAlert size={16} />
          )}
          {requesting ? 'Requesting…' : `Allow ${needingPrompt.map((p) => PERM_INFO[p].label).join(' & ')}`}
        </button>
      )}

      {denied.length > 0 && needingPrompt.length === 0 && (
        <button
          onClick={checkAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw size={13} /> Re-check permissions
        </button>
      )}
    </div>
  );
}
