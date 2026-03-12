'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { PlanResponse } from '@/core/application/client-services/plans-client.service';
import type { CreateOrganizationRequest, UpdateOrganizationRequest } from '@/core/communication/requests/organization';
import type {
  AdminOrganizationDetailResponse,
  AdminOrganizationResponse,
  AdminOrganizationSubscriptionResponse,
} from '@/core/communication/responses/admin-organizations';
import { AppError, ErrorCode } from '@/core/errors';

import type { AddMemberRequest } from '../client-services/admin-organizations-client.service';
import { adminOrganizationsClient } from '../client-services/admin-organizations-client.service';

// ── Types ─────────────────────────────────────────────────────────

interface AdminOrganizationsState {
  organizations: AdminOrganizationResponse[];
  selectedOrganization: AdminOrganizationDetailResponse | null;
  availablePlans: PlanResponse[];
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingPlans: boolean;
  searchQuery: string;
  filterStatus: string;
}

interface AdminOrganizationsContextValue extends AdminOrganizationsState {
  fetchOrganizations: () => Promise<void>;
  fetchOrganization: (id: string) => Promise<void>;
  createOrganization: (data: CreateOrganizationRequest) => Promise<AdminOrganizationResponse>;
  updateOrganization: (id: string, data: UpdateOrganizationRequest) => Promise<AdminOrganizationResponse>;
  toggleStatus: (id: string, isActive: boolean) => Promise<AdminOrganizationResponse>;
  deleteOrganization: (id: string) => Promise<void>;
  assignSubscription: (
    id: string,
    data: { planId: string; startedAt: string; expiresAt: string },
  ) => Promise<AdminOrganizationSubscriptionResponse>;
  addMember: (id: string, data: AddMemberRequest) => Promise<void>;
  fetchAvailablePlans: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  filteredOrganizations: AdminOrganizationResponse[];
}

// ── Reducer ───────────────────────────────────────────────────────

type AdminOrganizationsAction =
  | { type: 'ORGS_LOADING' }
  | { type: 'ORGS_LOADED'; organizations: AdminOrganizationResponse[] }
  | { type: 'ORGS_FAILURE' }
  | { type: 'ORG_DETAIL_LOADING' }
  | { type: 'ORG_DETAIL_LOADED'; organization: AdminOrganizationDetailResponse }
  | { type: 'ORG_DETAIL_FAILURE' }
  | { type: 'ORG_CREATED'; organization: AdminOrganizationResponse }
  | { type: 'ORG_UPDATED'; organization: AdminOrganizationResponse }
  | { type: 'ORG_DELETED'; organizationId: string }
  | { type: 'ORG_SUBSCRIPTION_UPDATED'; subscription: AdminOrganizationSubscriptionResponse }
  | { type: 'ORG_MEMBER_ADDED' }
  | { type: 'PLANS_LOADING' }
  | { type: 'PLANS_LOADED'; plans: PlanResponse[] }
  | { type: 'PLANS_FAILURE' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER_STATUS'; status: string };

const initialState: AdminOrganizationsState = {
  organizations: [],
  selectedOrganization: null,
  availablePlans: [],
  isLoading: false,
  isLoadingDetail: false,
  isLoadingPlans: false,
  searchQuery: '',
  filterStatus: 'all',
};

function adminOrganizationsReducer(
  state: AdminOrganizationsState,
  action: AdminOrganizationsAction,
): AdminOrganizationsState {
  switch (action.type) {
    case 'ORGS_LOADING':
      return { ...state, isLoading: true };
    case 'ORGS_LOADED':
      return { ...state, organizations: action.organizations, isLoading: false };
    case 'ORGS_FAILURE':
      return { ...state, isLoading: false };
    case 'ORG_DETAIL_LOADING':
      return { ...state, isLoadingDetail: true, selectedOrganization: null };
    case 'ORG_DETAIL_LOADED':
      return { ...state, selectedOrganization: action.organization, isLoadingDetail: false };
    case 'ORG_DETAIL_FAILURE':
      return { ...state, isLoadingDetail: false };
    case 'ORG_CREATED':
      return { ...state, organizations: [action.organization, ...state.organizations] };
    case 'ORG_UPDATED':
      return {
        ...state,
        organizations: state.organizations.map((o) => (o.id === action.organization.id ? action.organization : o)),
      };
    case 'ORG_DELETED':
      return {
        ...state,
        organizations: state.organizations.filter((o) => o.id !== action.organizationId),
      };
    case 'ORG_SUBSCRIPTION_UPDATED':
      return {
        ...state,
        selectedOrganization: state.selectedOrganization
          ? { ...state.selectedOrganization, subscription: action.subscription }
          : null,
      };
    case 'ORG_MEMBER_ADDED':
      return state;
    case 'PLANS_LOADING':
      return { ...state, isLoadingPlans: true };
    case 'PLANS_LOADED':
      return { ...state, availablePlans: action.plans, isLoadingPlans: false };
    case 'PLANS_FAILURE':
      return { ...state, isLoadingPlans: false };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.status };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AdminOrganizationsContext = createContext<AdminOrganizationsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function AdminOrganizationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminOrganizationsReducer, initialState);

  const fetchOrganizations = useCallback(async () => {
    dispatch({ type: 'ORGS_LOADING' });
    const response = await adminOrganizationsClient.listOrganizations();

    if (!response.success) {
      dispatch({ type: 'ORGS_FAILURE' });
      return;
    }

    dispatch({ type: 'ORGS_LOADED', organizations: response.data });
  }, []);

  const fetchOrganization = useCallback(async (id: string) => {
    dispatch({ type: 'ORG_DETAIL_LOADING' });
    const response = await adminOrganizationsClient.getOrganization(id);

    if (!response.success) {
      dispatch({ type: 'ORG_DETAIL_FAILURE' });
      return;
    }

    dispatch({ type: 'ORG_DETAIL_LOADED', organization: response.data });
  }, []);

  const createOrganization = useCallback(async (data: CreateOrganizationRequest) => {
    const response = await adminOrganizationsClient.createOrganization(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'ORG_CREATED', organization: response.data });
    return response.data;
  }, []);

  const updateOrganization = useCallback(async (id: string, data: UpdateOrganizationRequest) => {
    const response = await adminOrganizationsClient.updateOrganization(id, data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'ORG_UPDATED', organization: response.data });
    return response.data;
  }, []);

  const toggleStatus = useCallback(async (id: string, isActive: boolean) => {
    const response = await adminOrganizationsClient.toggleStatus(id, isActive);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'ORG_UPDATED', organization: response.data });
    return response.data;
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    const response = await adminOrganizationsClient.deleteOrganization(id);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'ORG_DELETED', organizationId: id });
  }, []);

  const assignSubscription = useCallback(
    async (id: string, data: { planId: string; startedAt: string; expiresAt: string }) => {
      const response = await adminOrganizationsClient.assignSubscription(id, data);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      dispatch({ type: 'ORG_SUBSCRIPTION_UPDATED', subscription: response.data });
      return response.data;
    },
    [],
  );

  const addMember = useCallback(
    async (id: string, data: AddMemberRequest) => {
      const response = await adminOrganizationsClient.addMember(id, data);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      dispatch({ type: 'ORG_MEMBER_ADDED' });
      // Refetch org detail to get updated members list
      await fetchOrganization(id);
    },
    [fetchOrganization],
  );

  const fetchAvailablePlans = useCallback(async () => {
    dispatch({ type: 'PLANS_LOADING' });
    const response = await adminOrganizationsClient.getAvailablePlans();

    if (!response.success) {
      dispatch({ type: 'PLANS_FAILURE' });
      return;
    }

    dispatch({ type: 'PLANS_LOADED', plans: response.data });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, []);

  const setFilterStatus = useCallback((status: string) => {
    dispatch({ type: 'SET_FILTER_STATUS', status });
  }, []);

  const filteredOrganizations = useMemo(() => {
    let result = state.organizations;

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.slug.toLowerCase().includes(query) ||
          (org.email && org.email.toLowerCase().includes(query)),
      );
    }

    if (state.filterStatus && state.filterStatus !== 'all') {
      const isActive = state.filterStatus === 'active';
      result = result.filter((org) => org.isActive === isActive);
    }

    return result;
  }, [state.organizations, state.searchQuery, state.filterStatus]);

  const value = useMemo<AdminOrganizationsContextValue>(
    () => ({
      ...state,
      fetchOrganizations,
      fetchOrganization,
      createOrganization,
      updateOrganization,
      toggleStatus,
      deleteOrganization,
      assignSubscription,
      addMember,
      fetchAvailablePlans,
      setSearchQuery,
      setFilterStatus,
      filteredOrganizations,
    }),
    [
      state,
      fetchOrganizations,
      fetchOrganization,
      createOrganization,
      updateOrganization,
      toggleStatus,
      deleteOrganization,
      assignSubscription,
      addMember,
      fetchAvailablePlans,
      setSearchQuery,
      setFilterStatus,
      filteredOrganizations,
    ],
  );

  return <AdminOrganizationsContext.Provider value={value}>{children}</AdminOrganizationsContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useAdminOrganizations(): AdminOrganizationsContextValue {
  const context = useContext(AdminOrganizationsContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useAdminOrganizations must be used within an AdminOrganizationsProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
