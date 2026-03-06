'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { CreateClientUserRequest, UpdateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError, ErrorCode } from '@/core/errors';

import { adminUsersClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

interface AdminUsersState {
  users: AdminUserResponse[];
  isLoading: boolean;
  searchQuery: string;
  filterOrganization: string;
  filterStatus: string;
}

interface AdminUsersContextValue extends AdminUsersState {
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateClientUserRequest) => Promise<{ user: AdminUserResponse }>;
  updateUser: (userId: string, data: UpdateClientUserRequest) => Promise<AdminUserResponse>;
  deleteUser: (userId: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterOrganization: (org: string) => void;
  setFilterStatus: (status: string) => void;
  filteredUsers: AdminUserResponse[];
}

// ── Reducer ───────────────────────────────────────────────────────

type AdminUsersAction =
  | { type: 'USERS_LOADING' }
  | { type: 'USERS_LOADED'; users: AdminUserResponse[] }
  | { type: 'USERS_FAILURE' }
  | { type: 'USER_CREATED'; user: AdminUserResponse }
  | { type: 'USER_UPDATED'; user: AdminUserResponse }
  | { type: 'USER_DELETED'; userId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER_ORGANIZATION'; org: string }
  | { type: 'SET_FILTER_STATUS'; status: string };

const initialState: AdminUsersState = {
  users: [],
  isLoading: false,
  searchQuery: '',
  filterOrganization: 'all',
  filterStatus: 'all',
};

function adminUsersReducer(state: AdminUsersState, action: AdminUsersAction): AdminUsersState {
  switch (action.type) {
    case 'USERS_LOADING':
      return { ...state, isLoading: true };
    case 'USERS_LOADED':
      return { ...state, users: action.users, isLoading: false };
    case 'USERS_FAILURE':
      return { ...state, isLoading: false };
    case 'USER_CREATED':
      return { ...state, users: [action.user, ...state.users] };
    case 'USER_UPDATED':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.user.id ? action.user : u)),
      };
    case 'USER_DELETED':
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.userId),
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_FILTER_ORGANIZATION':
      return { ...state, filterOrganization: action.org };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.status };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AdminUsersContext = createContext<AdminUsersContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminUsersReducer, initialState);

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'USERS_LOADING' });
    const response = await adminUsersClient.listUsers();

    if (!response.success) {
      dispatch({ type: 'USERS_FAILURE' });
      return;
    }

    dispatch({ type: 'USERS_LOADED', users: response.data.users });
  }, []);

  const createUser = useCallback(async (data: CreateClientUserRequest) => {
    const response = await adminUsersClient.createUser(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USER_CREATED', user: response.data.user });
    return response.data;
  }, []);

  const updateUser = useCallback(async (userId: string, data: UpdateClientUserRequest) => {
    const response = await adminUsersClient.updateUser(userId, data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USER_UPDATED', user: response.data });
    return response.data;
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    const response = await adminUsersClient.deleteUser(userId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USER_DELETED', userId });
  }, []);

  const resetPassword = useCallback(async (userId: string) => {
    const response = await adminUsersClient.resetPassword(userId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, []);

  const setFilterOrganization = useCallback((org: string) => {
    dispatch({ type: 'SET_FILTER_ORGANIZATION', org });
  }, []);

  const setFilterStatus = useCallback((status: string) => {
    dispatch({ type: 'SET_FILTER_STATUS', status });
  }, []);

  const filteredUsers = useMemo(() => {
    let result = state.users;

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(
        (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
      );
    }

    if (state.filterOrganization && state.filterOrganization !== 'all') {
      result = result.filter((user) => user.organizationId === state.filterOrganization);
    }

    if (state.filterStatus === 'super_admin') {
      result = result.filter((user) => user.isSuperAdmin);
    } else if (state.filterStatus === 'client') {
      result = result.filter((user) => !user.isSuperAdmin);
    }

    return result;
  }, [state.users, state.searchQuery, state.filterOrganization, state.filterStatus]);

  const value = useMemo<AdminUsersContextValue>(
    () => ({
      ...state,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      resetPassword,
      setSearchQuery,
      setFilterOrganization,
      setFilterStatus,
      filteredUsers,
    }),
    [
      state,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      resetPassword,
      setSearchQuery,
      setFilterOrganization,
      setFilterStatus,
      filteredUsers,
    ],
  );

  return <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useAdminUsers(): AdminUsersContextValue {
  const context = useContext(AdminUsersContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useAdminUsers must be used within an AdminUsersProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
