'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { OrganizationResponse } from '@/core/communication/responses/organization';
import { AppError, ErrorCode } from '@/core/errors';

import { organizationsClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

interface OrganizationState {
  organizations: OrganizationResponse[];
  activeOrganization: OrganizationResponse | null;
  isLoading: boolean;
}

interface OrganizationContextValue extends OrganizationState {
  setActiveOrganization: (organization: OrganizationResponse) => void;
  refreshOrganizations: () => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────

type OrganizationAction =
  | { type: 'ORGS_LOADING' }
  | { type: 'ORGS_LOADED'; organizations: OrganizationResponse[] }
  | { type: 'ORGS_FAILURE' }
  | { type: 'SET_ACTIVE'; organization: OrganizationResponse };

const initialState: OrganizationState = {
  organizations: [],
  activeOrganization: null,
  isLoading: false,
};

function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case 'ORGS_LOADING':
      return { ...state, isLoading: true };
    case 'ORGS_LOADED':
      return {
        organizations: action.organizations,
        activeOrganization: state.activeOrganization ?? action.organizations[0] ?? null,
        isLoading: false,
      };
    case 'ORGS_FAILURE':
      return { ...state, isLoading: false };
    case 'SET_ACTIVE':
      return { ...state, activeOrganization: action.organization };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(organizationReducer, initialState);

  const setActiveOrganization = useCallback((organization: OrganizationResponse) => {
    dispatch({ type: 'SET_ACTIVE', organization });
  }, []);

  const refreshOrganizations = useCallback(async () => {
    dispatch({ type: 'ORGS_LOADING' });
    const response = await organizationsClient.listOrganizations();

    if (!response.success) {
      dispatch({ type: 'ORGS_FAILURE' });
      return;
    }

    dispatch({ type: 'ORGS_LOADED', organizations: response.data });
  }, []);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      ...state,
      setActiveOrganization,
      refreshOrganizations,
    }),
    [state, setActiveOrganization, refreshOrganizations],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useOrganization must be used within an OrganizationProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
