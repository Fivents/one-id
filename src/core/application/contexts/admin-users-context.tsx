'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type {
  CreateClientUserRequest,
  RestoreClientUserRequest,
  UpdateClientUserRequest,
} from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError, ErrorCode } from '@/core/errors';

import { adminUsersClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

export interface SoftDeletedUserInfo {
  id: string;
  name: string;
  email: string;
}

export class UserSoftDeletedClientError extends Error {
  public readonly softDeletedUser: SoftDeletedUserInfo;

  constructor(message: string, softDeletedUser: SoftDeletedUserInfo) {
    super(message);
    this.name = 'UserSoftDeletedClientError';
    this.softDeletedUser = softDeletedUser;
  }
}

interface AdminUsersState {
  users: AdminUserResponse[];
  deletedUsers: AdminUserResponse[];
  isLoading: boolean;
  isLoadingDeleted: boolean;
  searchQuery: string;
  filterOrganization: string;
  filterStatus: string;
  selectedUserIds: Set<string>;
  selectedDeletedUserIds: Set<string>;
}

interface AdminUsersContextValue extends AdminUsersState {
  fetchUsers: () => Promise<void>;
  fetchDeletedUsers: () => Promise<void>;
  createUser: (data: CreateClientUserRequest) => Promise<{ user: AdminUserResponse }>;
  updateUser: (userId: string, data: UpdateClientUserRequest) => Promise<AdminUserResponse>;
  deleteUser: (userId: string) => Promise<void>;
  hardDeleteUser: (userId: string) => Promise<void>;
  restoreUser: (data: RestoreClientUserRequest) => Promise<{ user: AdminUserResponse }>;
  bulkSoftDelete: (userIds: string[]) => Promise<void>;
  bulkHardDelete: (userIds: string[]) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterOrganization: (org: string) => void;
  setFilterStatus: (status: string) => void;
  toggleUserSelection: (userId: string) => void;
  toggleAllUsers: () => void;
  clearUserSelection: () => void;
  toggleDeletedUserSelection: (userId: string) => void;
  toggleAllDeletedUsers: () => void;
  clearDeletedUserSelection: () => void;
  filteredUsers: AdminUserResponse[];
}

// ── Reducer ───────────────────────────────────────────────────────

type AdminUsersAction =
  | { type: 'USERS_LOADING' }
  | { type: 'USERS_LOADED'; users: AdminUserResponse[] }
  | { type: 'USERS_FAILURE' }
  | { type: 'DELETED_USERS_LOADING' }
  | { type: 'DELETED_USERS_LOADED'; users: AdminUserResponse[] }
  | { type: 'DELETED_USERS_FAILURE' }
  | { type: 'USER_CREATED'; user: AdminUserResponse }
  | { type: 'USER_UPDATED'; user: AdminUserResponse }
  | { type: 'USER_DELETED'; userId: string }
  | { type: 'USER_HARD_DELETED'; userId: string }
  | { type: 'USER_RESTORED'; user: AdminUserResponse; userId: string }
  | { type: 'USERS_BULK_DELETED'; userIds: string[] }
  | { type: 'USERS_BULK_HARD_DELETED'; userIds: string[] }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER_ORGANIZATION'; org: string }
  | { type: 'SET_FILTER_STATUS'; status: string }
  | { type: 'TOGGLE_USER_SELECTION'; userId: string }
  | { type: 'TOGGLE_ALL_USERS'; filteredIds: string[] }
  | { type: 'CLEAR_USER_SELECTION' }
  | { type: 'TOGGLE_DELETED_USER_SELECTION'; userId: string }
  | { type: 'TOGGLE_ALL_DELETED_USERS' }
  | { type: 'CLEAR_DELETED_USER_SELECTION' };

const initialState: AdminUsersState = {
  users: [],
  deletedUsers: [],
  isLoading: false,
  isLoadingDeleted: false,
  searchQuery: '',
  filterOrganization: 'all',
  filterStatus: 'all',
  selectedUserIds: new Set(),
  selectedDeletedUserIds: new Set(),
};

function adminUsersReducer(state: AdminUsersState, action: AdminUsersAction): AdminUsersState {
  switch (action.type) {
    case 'USERS_LOADING':
      return { ...state, isLoading: true };
    case 'USERS_LOADED':
      return { ...state, users: action.users, isLoading: false, selectedUserIds: new Set() };
    case 'USERS_FAILURE':
      return { ...state, isLoading: false };
    case 'DELETED_USERS_LOADING':
      return { ...state, isLoadingDeleted: true };
    case 'DELETED_USERS_LOADED':
      return { ...state, deletedUsers: action.users, isLoadingDeleted: false, selectedDeletedUserIds: new Set() };
    case 'DELETED_USERS_FAILURE':
      return { ...state, isLoadingDeleted: false };
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
        selectedUserIds: new Set([...state.selectedUserIds].filter((id) => id !== action.userId)),
      };
    case 'USER_HARD_DELETED':
      return {
        ...state,
        deletedUsers: state.deletedUsers.filter((u) => u.id !== action.userId),
        selectedDeletedUserIds: new Set([...state.selectedDeletedUserIds].filter((id) => id !== action.userId)),
      };
    case 'USER_RESTORED':
      return {
        ...state,
        deletedUsers: state.deletedUsers.filter((u) => u.id !== action.userId),
        users: [action.user, ...state.users],
        selectedDeletedUserIds: new Set([...state.selectedDeletedUserIds].filter((id) => id !== action.userId)),
      };
    case 'USERS_BULK_DELETED':
      return {
        ...state,
        users: state.users.filter((u) => !action.userIds.includes(u.id)),
        selectedUserIds: new Set(),
      };
    case 'USERS_BULK_HARD_DELETED':
      return {
        ...state,
        deletedUsers: state.deletedUsers.filter((u) => !action.userIds.includes(u.id)),
        selectedDeletedUserIds: new Set(),
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_FILTER_ORGANIZATION':
      return { ...state, filterOrganization: action.org };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.status };
    case 'TOGGLE_USER_SELECTION': {
      const next = new Set(state.selectedUserIds);
      if (next.has(action.userId)) {
        next.delete(action.userId);
      } else {
        next.add(action.userId);
      }
      return { ...state, selectedUserIds: next };
    }
    case 'TOGGLE_ALL_USERS': {
      const allSelected = action.filteredIds.every((id) => state.selectedUserIds.has(id));
      return { ...state, selectedUserIds: allSelected ? new Set() : new Set(action.filteredIds) };
    }
    case 'CLEAR_USER_SELECTION':
      return { ...state, selectedUserIds: new Set() };
    case 'TOGGLE_DELETED_USER_SELECTION': {
      const next = new Set(state.selectedDeletedUserIds);
      if (next.has(action.userId)) {
        next.delete(action.userId);
      } else {
        next.add(action.userId);
      }
      return { ...state, selectedDeletedUserIds: next };
    }
    case 'TOGGLE_ALL_DELETED_USERS': {
      const allSelected = state.deletedUsers.every((u) => state.selectedDeletedUserIds.has(u.id));
      return {
        ...state,
        selectedDeletedUserIds: allSelected ? new Set() : new Set(state.deletedUsers.map((u) => u.id)),
      };
    }
    case 'CLEAR_DELETED_USER_SELECTION':
      return { ...state, selectedDeletedUserIds: new Set() };
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

  const fetchDeletedUsers = useCallback(async () => {
    dispatch({ type: 'DELETED_USERS_LOADING' });
    const response = await adminUsersClient.listDeletedUsers();

    if (!response.success) {
      dispatch({ type: 'DELETED_USERS_FAILURE' });
      return;
    }

    dispatch({ type: 'DELETED_USERS_LOADED', users: response.data.users });
  }, []);

  const createUser = useCallback(async (data: CreateClientUserRequest) => {
    const response = await adminUsersClient.createUser(data);

    if (!response.success) {
      if (response.error.code === 'USER_SOFT_DELETED' && response.error.meta?.softDeletedUser) {
        throw new UserSoftDeletedClientError(
          response.error.message,
          response.error.meta.softDeletedUser as SoftDeletedUserInfo,
        );
      }

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

  const hardDeleteUser = useCallback(async (userId: string) => {
    const response = await adminUsersClient.hardDeleteUser(userId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USER_HARD_DELETED', userId });
  }, []);

  const restoreUser = useCallback(async (data: RestoreClientUserRequest) => {
    const response = await adminUsersClient.restoreUser(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USER_RESTORED', user: response.data.user, userId: data.userId });
    return response.data;
  }, []);

  const bulkSoftDelete = useCallback(async (userIds: string[]) => {
    const response = await adminUsersClient.bulkSoftDelete({ userIds });

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USERS_BULK_DELETED', userIds });
  }, []);

  const bulkHardDelete = useCallback(async (userIds: string[]) => {
    const response = await adminUsersClient.bulkHardDelete({ userIds });

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'USERS_BULK_HARD_DELETED', userIds });
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

  const toggleUserSelection = useCallback((userId: string) => {
    dispatch({ type: 'TOGGLE_USER_SELECTION', userId });
  }, []);

  const toggleAllUsers = useCallback(() => {
    const selectableIds = filteredUsers.filter((u) => !u.isSuperAdmin).map((u) => u.id);
    dispatch({ type: 'TOGGLE_ALL_USERS', filteredIds: selectableIds });
  }, [filteredUsers]);

  const clearUserSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_USER_SELECTION' });
  }, []);

  const toggleDeletedUserSelection = useCallback((userId: string) => {
    dispatch({ type: 'TOGGLE_DELETED_USER_SELECTION', userId });
  }, []);

  const toggleAllDeletedUsers = useCallback(() => {
    dispatch({ type: 'TOGGLE_ALL_DELETED_USERS' });
  }, []);

  const clearDeletedUserSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_DELETED_USER_SELECTION' });
  }, []);

  const value = useMemo<AdminUsersContextValue>(
    () => ({
      ...state,
      fetchUsers,
      fetchDeletedUsers,
      createUser,
      updateUser,
      deleteUser,
      hardDeleteUser,
      restoreUser,
      bulkSoftDelete,
      bulkHardDelete,
      resetPassword,
      setSearchQuery,
      setFilterOrganization,
      setFilterStatus,
      toggleUserSelection,
      toggleAllUsers,
      clearUserSelection,
      toggleDeletedUserSelection,
      toggleAllDeletedUsers,
      clearDeletedUserSelection,
      filteredUsers,
    }),
    [
      state,
      fetchUsers,
      fetchDeletedUsers,
      createUser,
      updateUser,
      deleteUser,
      hardDeleteUser,
      restoreUser,
      bulkSoftDelete,
      bulkHardDelete,
      resetPassword,
      setSearchQuery,
      setFilterOrganization,
      setFilterStatus,
      toggleUserSelection,
      toggleAllUsers,
      clearUserSelection,
      toggleDeletedUserSelection,
      toggleAllDeletedUsers,
      clearDeletedUserSelection,
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
