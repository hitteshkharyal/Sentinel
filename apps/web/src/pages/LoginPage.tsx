// ─────────────────────────────────────────────
// SENTINEL Web — Enterprise Login Page
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
            theme: 'outline',
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

  // Development convenience demo login (uses bootstrap admin credentials)
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-sentinel-500 selection:text-white radial-grid-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo Header */}
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sentinel-600 to-sentinel-800 flex items-center justify-center text-white shadow-lg shadow-sentinel-600/25 group-hover:scale-105 transition-transform">
            <Shield className="w-7 h-7" />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900">
            SENTINEL
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Operations Console
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Privacy-preserving autonomous physical space intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-slate-200/90 relative overflow-hidden">
          {/* ── PENDING APPROVAL STATE CARD ── */}
          {pendingEmail ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-100 text-amber-800 mb-2">
                  Access Restricted · Hardware Perimeter
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Registration Awaiting Admin Approval
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sentinel controls physical IoT radar sensors and automation actuators. To prevent unauthorized facility access, your account{' '}
                  <strong className="text-slate-800">({pendingEmail})</strong> requires explicit approval by an administrator.
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

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Account:</span>
                  <span className="font-bold text-slate-800">{pendingEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Pending Authorization
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Perimeter:</span>
                  <span className="text-slate-600">Zero-Trust Protected</span>
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
                  className="w-full justify-center text-xs text-slate-500 hover:text-slate-800"
                >
                  Sign in with a different account
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Account Linked Success Banner */}
              {linkedMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Google Account Linked</span>
                    <p className="text-emerald-700 mt-0.5">
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
              <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-sentinel-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hardware IoT Perimeter:</strong> Only administrator-allowed emails or pre-authorized accounts can access portal controls.
                </span>
              </div>

              {/* ── 1. Google OAuth Button Section ── */}
              <div className="space-y-3">
                <div id="google-btn-container" className="flex justify-center min-h-[44px]" />

                {/* Quick Demo Operator Login (when testing without Google popup) */}
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleDemoLogin}
                  disabled={isSubmitting}
                  className="w-full justify-center text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5"
                >
                  <span className="mr-2">⚡</span> Quick Demo Login (System Admin)
                </Button>

                <div
                  onClick={() => {
                    setEmail('admin@sentinel.local');
                    setPassword('SentinelAdmin2026!');
                  }}
                  className="text-[11px] text-slate-500 text-center font-mono bg-slate-100/80 hover:bg-slate-200/60 transition-colors py-1.5 px-2 rounded-lg border border-slate-200/60 cursor-pointer select-all"
                  title="Click to autofill form fields"
                >
                  <span className="text-slate-400 font-sans mr-1">Credentials:</span>
                  <strong>admin@sentinel.local</strong> · <strong>SentinelAdmin2026!</strong>
                </div>
              </div>


              {/* ── 2. Divider ── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-400 font-semibold">Or with credentials</span>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Argon2 / bcrypt protected</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sentinel-500 focus:ring-2 focus:ring-sentinel-500/20 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                    className="w-full justify-center font-bold shadow-md shadow-sentinel-600/20 py-2.5"
                  >
                    Sign In to Platform
                  </Button>
                </div>
              </form>

              {/* ── 4. Privacy Footer Guarantee ── */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
                  <Lock className="w-3.5 h-3.5 text-sentinel-600" />
                  <span>Encrypted Session · Zero Camera Feeds</span>
                </div>
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-bold text-sentinel-600 hover:text-sentinel-700 hover:underline">
                    Register space
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
