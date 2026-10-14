// ─────────────────────────────────────────────
// SENTINEL Web — Authentication Context & State Provider
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@sentinel/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  linkedProviders: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ accountLinked?: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'sentinel_auth_token';
const REFRESH_TOKEN_KEY = 'sentinel_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Store tokens in state and localStorage
  const saveTokens = useCallback((newToken: string, newRefreshToken?: string) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setLinkedProviders([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  // Attempt to refresh expired access token
  const tryRefreshToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const json = await res.json();
      if (json.success && json.data?.token) {
        saveTokens(json.data.token, json.data.refreshToken);
        return json.data.token;
      }
      return null;
    } catch {
      return null;
    }
  }, [saveTokens]);

  // Fetch current user profile with token
  const fetchUserProfile = useCallback(
    async (authToken: string) => {
      try {
        let activeToken = authToken;
        let res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });

        if (!res.ok) {
          // Token might be expired, attempt refresh
          const newToken = await tryRefreshToken();
          if (!newToken) {
            clearAuth();
            return;
          }
          activeToken = newToken;
          res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${activeToken}`,
            },
          });
          if (!res.ok) {
            clearAuth();
            return;
          }
        }

        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data.user);
          setLinkedProviders(json.data.linkedProviders || []);
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuth, tryRefreshToken]
  );

  // Check URL parameters for OAuth redirect token (e.g. from Google OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRefreshToken = params.get('refreshToken');

    if (urlToken) {
      saveTokens(urlToken, urlRefreshToken || undefined);
      // Clean query params from URL without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      fetchUserProfile(urlToken);
    } else if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [saveTokens, fetchUserProfile, token]);

  // Login with Email & Password
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Login failed. Please check your credentials.');
      }

      saveTokens(json.data.token, json.data.refreshToken);
      setUser(json.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Register with Email, Password & Display Name
  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Registration failed.');
      }

      saveTokens(json.data.token, json.data.refreshToken);
      setUser(json.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Login / Link with Google
  const loginWithGoogle = async (idToken: string): Promise<{ accountLinked?: boolean }> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Google authentication failed.');
      }

      saveTokens(json.data.token, json.data.refreshToken);
      setUser(json.data.user);
      return { accountLinked: json.data.accountLinked };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignored
      }
    }
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        linkedProviders,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
