import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Mail, KeyRound, User, Check } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { checkPasswordStrength, checkPasswordRequirements } from '../lib/password';
import { cn } from '../lib/utils';

const strengthColors: Record<string, string> = {
  none: 'bg-zinc-200 dark:bg-zinc-700',
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  strong: 'bg-emerald-500',
};

const strengthLabels: Record<string, string> = {
  none: '',
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
};

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = checkPasswordStrength(password);
  const requirements = checkPasswordRequirements(password);
  const strengthWidth = { none: '0%', weak: '33%', fair: '66%', strong: '100%' };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await signup(name, email, password, confirmPw);
      navigate('/app/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-[#0e0e10]">
      <div className="w-full max-w-[380px]">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Create account
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Start your secure notes today
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Full name"
              type="text"
              placeholder="Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            {/* Password with strength indicator */}
            <div className="space-y-2">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                leftIcon={<KeyRound className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {password && (
                <div className="space-y-2">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', strengthColors[strength])}
                        style={{ width: strengthWidth[strength] }}
                      />
                    </div>
                    {strength !== 'none' && (
                      <span className={cn('text-xs font-medium',
                        strength === 'weak' && 'text-red-500',
                        strength === 'fair' && 'text-amber-500',
                        strength === 'strong' && 'text-emerald-500',
                      )}>
                        {strengthLabels[strength]}
                      </span>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="space-y-1">
                    {[
                      { met: requirements.minLength, label: 'At least 8 characters' },
                      { met: requirements.hasNumber, label: 'Contains a number' },
                      { met: requirements.hasSpecial, label: 'Contains a special character' },
                    ].map(({ met, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs">
                        <Check className={cn('h-3 w-3 transition-colors', met ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600')} />
                        <span className={cn('transition-colors', met ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600')}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              required
              error={confirmPw && password !== confirmPw ? 'Passwords do not match' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
