'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { LoginAccessCodeRequest } from '@/core/communication/requests/auth';
import type { TotemAuthResponse } from '@/core/communication/responses/auth';
import type { EventResponse } from '@/core/communication/responses/event';
import { AppError, ErrorCode } from '@/core/errors';

import { authClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

interface TotemState {
  totem: TotemAuthResponse['totem'] | null;
  totemSession: { token: string } | null;
  activeEvent: EventResponse | null;
  isAuthenticated: boolean;
}

interface TotemContextValue extends TotemState {
  authenticateTotem: (data: LoginAccessCodeRequest) => Promise<void>;
  logoutTotem: () => void;
  setActiveEvent: (event: EventResponse | null) => void;
}

// ── Reducer ───────────────────────────────────────────────────────

type TotemAction =
  | { type: 'TOTEM_AUTH_SUCCESS'; totem: TotemAuthResponse['totem']; token: string }
  | { type: 'TOTEM_LOGOUT' }
  | { type: 'SET_ACTIVE_EVENT'; event: EventResponse | null };

const initialState: TotemState = {
  totem: null,
  totemSession: null,
  activeEvent: null,
  isAuthenticated: false,
};

function totemReducer(state: TotemState, action: TotemAction): TotemState {
  switch (action.type) {
    case 'TOTEM_AUTH_SUCCESS':
      return {
        totem: action.totem,
        totemSession: { token: action.token },
        activeEvent: state.activeEvent,
        isAuthenticated: true,
      };
    case 'TOTEM_LOGOUT':
      return { totem: null, totemSession: null, activeEvent: null, isAuthenticated: false };
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEvent: action.event };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const TotemContext = createContext<TotemContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function TotemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(totemReducer, initialState);

  const authenticateTotem = useCallback(async (data: LoginAccessCodeRequest) => {
    const response = await authClient.tokenLogin(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INVALID_ACCESS_CODE,
        message: response.error.message,
        httpStatus: 401,
        level: 'warning',
      });
    }

    dispatch({
      type: 'TOTEM_AUTH_SUCCESS',
      totem: response.data.totem,
      token: response.data.token,
    });
  }, []);

  const logoutTotem = useCallback(() => {
    dispatch({ type: 'TOTEM_LOGOUT' });
  }, []);

  const setActiveEvent = useCallback((event: EventResponse | null) => {
    dispatch({ type: 'SET_ACTIVE_EVENT', event });
  }, []);

  const value = useMemo<TotemContextValue>(
    () => ({
      ...state,
      authenticateTotem,
      logoutTotem,
      setActiveEvent,
    }),
    [state, authenticateTotem, logoutTotem, setActiveEvent],
  );

  return <TotemContext.Provider value={value}>{children}</TotemContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useTotem(): TotemContextValue {
  const context = useContext(TotemContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useTotem must be used within a TotemProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
