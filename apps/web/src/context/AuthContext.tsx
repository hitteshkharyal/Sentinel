// ─────────────────────────────────────────────
// SENTINEL Web — Authentication Context & State Provider
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AllowlistEntry, Role, UserStatus } from '@sentinel/types';

export interface AuthError extends Error {
  code?: string;
  statusCode?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  linkedProviders: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ accountLinked?: boolean }>;
  logout: () => Promise<void>;
  checkEmailStatus: (email: string) => Promise<{ email: string; status: UserStatus | 'NOT_REQUESTED'; role?: Role }>;
  getAccessRequests: () => Promise<{ pending: AllowlistEntry[]; approved: AllowlistEntry[]; rejected: AllowlistEntry[] }>;
  allowlistEmail: (email: string, role: Role, notes?: string) => Promise<AllowlistEntry>;
  approveAccessRequest: (id: string, role?: Role, notes?: string) => Promise<AllowlistEntry>;
  rejectAccessRequest: (id: string, notes?: string) => Promise<AllowlistEntry>;
  revokeAllowlistEntry: (id: string) => Promise<void>;
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
        const error = new Error(json.error?.message || 'Login failed. Please check your credentials.') as AuthError;
        error.code = json.error?.code;
        error.statusCode = res.status;
        throw error;
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
        const error = new Error(json.error?.message || 'Registration failed.') as AuthError;
        error.code = json.error?.code;
        error.statusCode = res.status;
        throw error;
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
        const error = new Error(json.error?.message || 'Google authentication failed.') as AuthError;
        error.code = json.error?.code;
        error.statusCode = res.status;
        throw error;
      }

      saveTokens(json.data.token, json.data.refreshToken);
      setUser(json.data.user);
      return { accountLinked: json.data.accountLinked };
    } finally {
      setIsLoading(false);
    }
  };

  // Check email approval status
  const checkEmailStatus = async (email: string): Promise<{ email: string; status: UserStatus | 'NOT_REQUESTED'; role?: Role }> => {
    const res = await fetch(`${API_BASE}/auth/check-status?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to check status');
    }
    return json.data;
  };

  // Admin: Get Access Requests
  const getAccessRequests = async () => {
    if (!token) throw new Error('Authentication required');
    const res = await fetch(`${API_BASE}/auth/access-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch access requests');
    }
    return json.data;
  };

  // Admin: Allowlist Email
  const allowlistEmail = async (email: string, role: Role = 'OPERATOR', notes?: string) => {
    if (!token) throw new Error('Authentication required');
    const res = await fetch(`${API_BASE}/auth/allowlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, role, notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to pre-authorize email');
    }
    return json.data;
  };

  // Admin: Approve Request
  const approveAccessRequest = async (id: string, role?: Role, notes?: string) => {
    if (!token) throw new Error('Authentication required');
    const res = await fetch(`${API_BASE}/auth/access-requests/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role, notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to approve access request');
    }
    return json.data;
  };

  // Admin: Reject Request
  const rejectAccessRequest = async (id: string, notes?: string) => {
    if (!token) throw new Error('Authentication required');
    const res = await fetch(`${API_BASE}/auth/access-requests/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to reject access request');
    }
    return json.data;
  };

  // Admin: Revoke entry
  const revokeAllowlistEntry = async (id: string) => {
    if (!token) throw new Error('Authentication required');
    const res = await fetch(`${API_BASE}/auth/allowlist/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to revoke entry');
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

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin,
        linkedProviders,
        login,
        register,
        loginWithGoogle,
        logout,
        checkEmailStatus,
        getAccessRequests,
        allowlistEmail,
        approveAccessRequest,
        rejectAccessRequest,
        revokeAllowlistEntry,
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
