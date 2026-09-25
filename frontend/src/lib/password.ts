import type { PasswordStrength } from '../types/user';

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'none';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score <= 3) return 'fair';
  return 'strong';
}

export interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}
