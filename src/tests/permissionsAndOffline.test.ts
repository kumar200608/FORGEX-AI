import { describe, it, expect, vi, beforeEach } from 'vitest';
import { permissionManager } from '@/lib/permissions/permissionManager';

describe('Android APK Permissions & Offline Storage Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries all permissions and returns status defaults gracefully', async () => {
    const statuses = await permissionManager.queryAll();
    expect(statuses).toBeDefined();
    expect(statuses).toHaveProperty('camera');
    expect(statuses).toHaveProperty('microphone');
    expect(statuses).toHaveProperty('geolocation');
  });

  it('handles query for camera permission when navigator.permissions exists', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    const state = await permissionManager.query('camera');
    expect(state).toBe('granted');
    expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' });
    expect(permissionManager.getCached('camera')).toBe('granted');
  });

  it('handles query error gracefully by returning unknown', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('Not supported'));
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    const state = await permissionManager.query('microphone');
    expect(state).toBe('unknown');
  });

  it('safely handles getUserMedia camera rejection (denied)', async () => {
    const deniedErr = new Error('Permission denied');
    deniedErr.name = 'NotAllowedError';

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(deniedErr),
      },
      configurable: true,
      writable: true,
    });

    const result = await permissionManager.requestCamera();
    expect(result).toBe(false);
    expect(permissionManager.getCached('camera')).toBe('denied');
  });

  it('safely handles getUserMedia mic rejection (denied)', async () => {
    const deniedErr = new Error('Permission denied');
    deniedErr.name = 'PermissionDeniedError';

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(deniedErr),
      },
      configurable: true,
      writable: true,
    });

    const result = await permissionManager.requestMicrophone();
    expect(result).toBe(false);
    expect(permissionManager.getCached('microphone')).toBe('denied');
  });

  it('safely handles geolocation position request', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
        },
      });
    });

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const pos = await permissionManager.requestGeolocation();
    expect(pos).not.toBeNull();
    expect(pos?.coords.latitude).toBe(12.9716);
    expect(permissionManager.getCached('geolocation')).toBe('granted');
  });
});
