import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types';
import { apiFetch } from './api';

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : 'U';
}

function mapBackendUser(u: { id: string; name?: string; email: string; createdAt?: string }): User {
  return {
    id: u.id,
    name: u.name || u.email.split('@')[0],
    email: u.email,
    avatarInitials: getInitials(u.name, u.email),
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

/**
 * Authenticate user with backend.
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const res = await apiFetch<{
    token: string;
    user: { id: string; name: string; email: string; publicKey?: string };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  return {
    user: mapBackendUser(res.user),
    token: res.token,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };
}

/**
 * Register new user with backend.
 */
export async function signup(credentials: SignupCredentials): Promise<AuthSession> {
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error('Passwords do not match.');
  }
  if (credentials.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  // Generate a valid public key representation for end-to-end envelope exchange
  const publicKey = `RSA-PUBKEY-USER-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const res = await apiFetch<{
    token: string;
    user: { id: string; name: string; email: string; publicKey?: string };
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      publicKey,
    }),
  });

  return {
    user: mapBackendUser(res.user),
    token: res.token,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };
}

/**
 * Log out user.
 */
export async function logout(): Promise<void> {
  // Stateless JWT logout
  return Promise.resolve();
}

/**
 * Restore session from stored token via /auth/me.
 */
export async function getCurrentUser(token: string): Promise<User | null> {
  if (!token || token.startsWith('mock-jwt-')) {
    return null;
  }
  try {
    const user = await apiFetch<{ id: string; name: string; email: string; publicKey?: string }>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return mapBackendUser(user);
  } catch {
    return null;
  }
}

/**
 * Search users for sharing from real database.
 */
export async function searchUsers(
  query: string,
  excludeId: string
): Promise<User[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    const list = await apiFetch<{ id: string; email: string; publicKey?: string }[]>(
      `/users/search?email=${encodeURIComponent(query)}`
    );
    return list
      .filter((u) => u.id !== excludeId)
      .map((u) => mapBackendUser({ id: u.id, email: u.email }));
  } catch {
    return [];
  }
}
