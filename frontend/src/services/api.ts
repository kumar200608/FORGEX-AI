const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('securenotes-v2-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.token;
    if (!token || typeof token !== 'string' || token.startsWith('mock-jwt-')) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      localStorage.removeItem('securenotes-v2-auth');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } catch {}
    throw new Error('Authentication required. Please sign in.');
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const msg = json.error || json.message || `Request failed with status ${response.status}`;
    throw new Error(msg);
  }

  return json.data !== undefined ? json.data : json;
}
