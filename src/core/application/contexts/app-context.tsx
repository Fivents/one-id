'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { AppError, ErrorCode } from '@/core/errors';

import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';
import { useOrganization } from './organization-context';

// ── Types ─────────────────────────────────────────────────────────

interface AppState {
  isAppLoading: boolean;
  isInitialized: boolean;
}

interface AppContextValue extends AppState {
  initializeApp: () => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────

type AppAction = { type: 'APP_INITIALIZING' } | { type: 'APP_INITIALIZED' } | { type: 'APP_INIT_FAILED' };

const initialState: AppState = {
  isAppLoading: true,
  isInitialized: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'APP_INITIALIZING':
      return { isAppLoading: true, isInitialized: false };
    case 'APP_INITIALIZED':
      return { isAppLoading: false, isInitialized: true };
    case 'APP_INIT_FAILED':
      return { isAppLoading: false, isInitialized: false };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { refreshSession, isAuthenticated } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const { fetchNotifications } = useNotifications();
  const initRef = useRef(false);

  const initializeApp = useCallback(async () => {
    dispatch({ type: 'APP_INITIALIZING' });

    try {
      await refreshSession();
    } catch {
      dispatch({ type: 'APP_INIT_FAILED' });
      return;
    }

    dispatch({ type: 'APP_INITIALIZED' });
  }, [refreshSession]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshOrganizations();
      fetchNotifications();
    }
  }, [isAuthenticated, refreshOrganizations, fetchNotifications]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      initializeApp,
    }),
    [state, initializeApp],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useApp must be used within an AppProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
