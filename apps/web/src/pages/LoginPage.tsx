// ─────────────────────────────────────────────
// SENTINEL Web — Enterprise Login Page
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: number; text?: string }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedMessage, setLinkedMessage] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Check if user came from account linking redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('linked') === 'true') {
      setLinkedMessage(true);
    }
  }, [location.search]);

  // Initialize Google Identity Services (GIS) button if Google Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

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
        setError((err as Error).message);
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
  }, [googleClientId, loginWithGoogle, navigate, from]);

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
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Development convenience demo login
  const handleDemoLogin = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await loginWithGoogle('mock_google_director@sentinel.io');
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
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
            <Alert variant="danger" className="mb-5 text-xs" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

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
              <span className="mr-2">⚡</span> Quick Demo Login (Director)
            </Button>
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
        </div>
      </div>
    </div>
  );
};
