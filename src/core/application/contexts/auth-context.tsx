'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { LoginEmailRequest } from '@/core/communication/requests/auth';
import type { AuthUserResponse } from '@/core/communication/responses/auth';
import { AppError, ErrorCode } from '@/core/errors';

import { authClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginEmailRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; user: AuthUserResponse }
  | { type: 'AUTH_FAILURE' }
  | { type: 'AUTH_LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return { user: action.user, isAuthenticated: true, isLoading: false };
    case 'AUTH_FAILURE':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'AUTH_LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (data: LoginEmailRequest) => {
    dispatch({ type: 'AUTH_LOADING' });
    const response = await authClient.loginWithEmail(data);

    if (!response.success) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw new AppError({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: response.error.message,
        httpStatus: 401,
        level: 'warning',
      });
    }

    dispatch({ type: 'AUTH_SUCCESS', user: response.data.user });
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'AUTH_LOADING' });
    const response = await authClient.refreshSession();

    if (!response.success) {
      dispatch({ type: 'AUTH_FAILURE' });
      return;
    }

    dispatch({ type: 'AUTH_SUCCESS', user: response.data.user });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshSession,
    }),
    [state, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useAuth must be used within an AuthProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
