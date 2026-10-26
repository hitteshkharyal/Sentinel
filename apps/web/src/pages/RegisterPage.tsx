// ─────────────────────────────────────────────
// SENTINEL Web — Enterprise Registration Page
// GuardianEye Inspired Obsidian Glassmorphism
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await register(email, password, displayName);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const authErr = err as { message: string; code?: string };
      if (authErr.code === 'ACCOUNT_PENDING_APPROVAL') {
        navigate(`/login?pendingApproval=true&email=${encodeURIComponent(email)}`, { replace: true });
      } else {
        setError(authErr.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 cyber-grid-bg relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-black overflow-hidden font-sans">
      {/* Top Floating Theme & Portal Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <ThemeSwitcher />
        <Link
          to="/"
          className="text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors px-2.5 py-1.5 rounded-lg border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md"
        >
          Portal
        </Link>
      </div>

      {/* Ambient Neon Cyan Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          {/* GuardianEye 45° Diamond Emblem */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/20 border border-cyan-400 rotate-45 rounded-sm shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform" />
            <Shield className="w-5 h-5 text-cyan-300 relative z-10" />
          </div>
          <span className="font-mono font-black text-2xl tracking-wider text-white">
            SENTINEL<span className="text-cyan-400">.AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
          OPERATOR REGISTRATION
        </h2>
        <p className="text-xs text-cyan-400/80 mt-1 font-mono">
          {'// ZERO-OPTICAL AUTONOMOUS INTELLIGENCE ONBOARDING'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="glass-card hud-bracket p-6 sm:p-10 relative">
          {error && (
            <Alert variant="danger" className="mb-5 text-xs" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2.5 font-mono">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-300">HARDWARE ZERO-TRUST:</strong> Self-registrations require administrator authorization before access to physical sensor automation is activated.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name / Operator Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Vance"
              required
              disabled={isSubmitting}
            />

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.vance@facility.org"
              required
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-cyan-500/25 bg-[#030712]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-cyan-500/25 bg-[#030712]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center font-bold text-xs uppercase tracking-wider py-2.5"
              >
                Register & Initialize Platform
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-cyan-500/15 text-center font-mono">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyan-400/80 mb-3">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>ARGON2 / BCRYPT PASSWORD PROTECTION</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                Sign in to console
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
