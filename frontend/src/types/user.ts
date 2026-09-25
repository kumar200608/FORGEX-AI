export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type PasswordStrength = 'none' | 'weak' | 'fair' | 'strong';
