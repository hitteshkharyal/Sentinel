// ─────────────────────────────────────────────
// SENTINEL Web — Enterprise Login Page
// GuardianEye Inspired Obsidian Glassmorphism
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AuthError } from '../context/AuthContext';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated, checkEmailStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedMessage, setLinkedMessage] = useState(false);

  // Hardware IoT Access Control pending state
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard';

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Inspect URL parameters for OAuth redirect token or pending approval status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('linked') === 'true') {
      setLinkedMessage(true);
    }
    if (params.get('pendingApproval') === 'true') {
      const emailParam = params.get('email');
      if (emailParam) {
        setPendingEmail(emailParam);
      }
    }
  }, [location.search]);

  // Initialize Google Identity Services (GIS) button
  useEffect(() => {
    if (!googleClientId || pendingEmail) return;

    const handleGoogleCredentialResponse = async (response: { credential: string }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const result = await loginWithGoogle(response.credential);
        if (result.accountLinked) {
          setLinkedMessage(true);
        }
        navigate(from, { replace: true });
      } catch (err) {
        const authErr = err as AuthError;
        if (authErr.code === 'ACCOUNT_PENDING_APPROVAL') {
          setPendingEmail(email || 'your Google account');
        } else {
          setError(authErr.message);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    const loadGoogleScript = () => {
      if (document.getElementById('google-client-script')) {
        renderGoogleBtn();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleBtn;
      document.head.appendChild(script);
    };

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        const targetDiv = document.getElementById('google-btn-container');
        if (targetDiv) {
          targetDiv.innerHTML = '';
          window.google.accounts.id.renderButton(targetDiv, {
            theme: 'filled_black',
            size: 'large',
            width: 380,
            text: 'continue_with',
          });
        }
      }
    };

    loadGoogleScript();
  }, [googleClientId, loginWithGoogle, navigate, from, pendingEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const authErr = err as AuthError;
      if (authErr.code === 'ACCOUNT_PENDING_APPROVAL') {
        setPendingEmail(email);
      } else {
        setError(authErr.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Development convenience demo login
  const handleDemoLogin = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setEmail('admin@sentinel.local');
      setPassword('SentinelAdmin2026!');
      await login('admin@sentinel.local', 'SentinelAdmin2026!');
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check approval status for pending user
  const handleCheckStatus = async () => {
    if (!pendingEmail) return;
    try {
      setCheckingStatus(true);
      setStatusFeedback(null);
      const res = await checkEmailStatus(pendingEmail);
      if (res.status === 'ACTIVE') {
        setStatusFeedback('🎉 Approved! Your account is now active. You may now sign in.');
        setPendingEmail(null);
      } else {
        setStatusFeedback('⏳ Still Pending: The administrator has not approved your request yet.');
      }
    } catch (err) {
      setStatusFeedback((err as Error).message);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 cyber-grid-bg relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-black overflow-hidden font-sans">
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
          OPERATIONS CONSOLE
        </h2>
        <p className="text-xs text-cyan-400/80 mt-1 font-mono">
          {'// ZERO-OPTICAL AUTONOMOUS SPATIAL INTELLIGENCE'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="glass-card hud-bracket p-6 sm:p-10 relative">
          {/* ── PENDING APPROVAL STATE CARD ── */}
          {pendingEmail ? (
            <div className="space-y-5 text-center font-mono">
              <div className="w-14 h-14 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase bg-amber-950 text-amber-400 border border-amber-500/30 mb-2">
                  Access Restricted · Hardware Perimeter
                </span>
                <h3 className="text-lg font-bold text-white uppercase">
                  Awaiting Administrator Approval
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans font-light">
                  Sentinel governs physical IoT radar sensors and automation actuators. Your account{' '}
                  <strong className="text-cyan-300 font-mono">({pendingEmail})</strong> requires explicit approval before access is enabled.
                </p>
              </div>

              {statusFeedback && (
                <Alert
                  variant={statusFeedback.includes('Approved') ? 'success' : 'warning'}
                  className="text-xs text-left"
                >
                  {statusFeedback}
                </Alert>
              )}

              <div className="p-4 rounded-xl bg-[#020612] border border-cyan-500/20 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-[10px]">Account:</span>
                  <span className="font-bold text-cyan-300 truncate max-w-[200px]">{pendingEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-[10px]">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Pending Authorization
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-[10px]">Perimeter:</span>
                  <span className="text-slate-400">Zero-Trust Protected</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleCheckStatus}
                  isLoading={checkingStatus}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="w-full justify-center font-bold text-xs py-2.5"
                >
                  Check Approval Status
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingEmail(null);
                    setStatusFeedback(null);
                  }}
                  className="w-full justify-center text-xs text-slate-400 hover:text-cyan-300"
                >
                  Sign in with a different account
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Account Linked Success Banner */}
              {linkedMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider">Google Account Linked</span>
                    <p className="text-emerald-400/80 mt-0.5 font-sans font-light">
                      Your Google identity was automatically linked to your existing profile.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert
                  variant="danger"
                  className="mb-5 text-xs"
                  onDismiss={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {/* Hardware Security Notice Banner */}
              <div className="mb-5 p-3 rounded-xl bg-[#040e21] border border-cyan-500/25 text-[11px] text-slate-300 flex items-start gap-2.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">HARDWARE PERIMETER:</strong> Authorized facility operators and pre-approved accounts only.
                </span>
              </div>

              {/* ── 1. Google OAuth & Quick Demo ── */}
              <div className="space-y-3">
                <div id="google-btn-container" className="flex justify-center min-h-[44px]" />

                {/* Quick Demo Operator Login */}
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleDemoLogin}
                  disabled={isSubmitting}
                  className="w-full justify-center text-xs font-mono font-bold py-2.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <span className="mr-2">⚡</span> Quick Demo Login (System Admin)
                </Button>

                <div
                  onClick={() => {
                    setEmail('admin@sentinel.local');
                    setPassword('SentinelAdmin2026!');
                  }}
                  className="text-[10px] text-cyan-400/80 text-center font-mono bg-[#020612] hover:bg-[#061226] transition-colors py-2 px-3 rounded-lg border border-cyan-500/20 cursor-pointer select-all"
                  title="Click to autofill form fields"
                >
                  <span className="text-slate-500 uppercase mr-1">Pre-filled:</span>
                  <strong className="text-cyan-300">admin@sentinel.local</strong> · <strong className="text-cyan-300">SentinelAdmin2026!</strong>
                </div>
              </div>

              {/* ── 2. Divider ── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cyan-500/15" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                  <span className="bg-[#060e1d] px-3 text-slate-400 font-semibold border border-cyan-500/20 rounded">
                    Or with credentials
                  </span>
                </div>
              </div>

              {/* ── 3. Email & Password Form ── */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@sentinel.io"
                  required
                  disabled={isSubmitting}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5 font-mono">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Password
                    </label>
                    <span className="text-[10px] text-cyan-400/70">Argon2 / bcrypt protected</span>
                  </div>
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full justify-center font-bold text-xs uppercase tracking-wider py-2.5"
                  >
                    Sign In to Console
                  </Button>
                </div>
              </form>

              {/* ── 4. Privacy Footer Guarantee ── */}
              <div className="mt-6 pt-4 border-t border-cyan-500/15 text-center font-mono">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyan-400/80 mb-3">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ENCRYPTED SESSION · ZERO CAMERA FEEDS</span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                    Register facility space
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
