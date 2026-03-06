'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type {
  BulkCreateTotemsRequest,
  CreateAdminTotemRequest,
  UpdateAdminTotemRequest,
} from '@/core/communication/requests/admin-totems';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';
import { AppError, ErrorCode } from '@/core/errors';

import { adminTotemsClient } from '../client-services/admin-totems-client.service';

// ── Types ─────────────────────────────────────────────────────────

interface AdminTotemsState {
  totems: AdminTotemResponse[];
  deletedTotems: AdminTotemResponse[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isLoadingDeleted: boolean;
  searchQuery: string;
  filterStatus: string;
}

interface AdminTotemsContextValue extends AdminTotemsState {
  fetchTotems: () => Promise<void>;
  fetchDeletedTotems: () => Promise<void>;
  createTotem: (data: CreateAdminTotemRequest) => Promise<AdminTotemResponse>;
  bulkCreateTotems: (data: BulkCreateTotemsRequest) => Promise<AdminTotemResponse[]>;
  updateTotem: (totemId: string, data: UpdateAdminTotemRequest) => Promise<AdminTotemResponse>;
  deleteTotem: (totemId: string) => Promise<void>;
  hardDeleteTotem: (totemId: string) => Promise<void>;
  restoreTotem: (totemId: string) => Promise<AdminTotemResponse>;
  generateAccessToken: (totemId: string) => Promise<AdminTotemResponse>;
  revokeAccessToken: (totemId: string) => Promise<AdminTotemResponse>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  toggleSelection: (totemId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  filteredTotems: AdminTotemResponse[];
}

// ── Reducer ───────────────────────────────────────────────────────

type AdminTotemsAction =
  | { type: 'TOTEMS_LOADING' }
  | { type: 'TOTEMS_LOADED'; totems: AdminTotemResponse[] }
  | { type: 'TOTEMS_FAILURE' }
  | { type: 'DELETED_TOTEMS_LOADING' }
  | { type: 'DELETED_TOTEMS_LOADED'; totems: AdminTotemResponse[] }
  | { type: 'DELETED_TOTEMS_FAILURE' }
  | { type: 'TOTEM_CREATED'; totem: AdminTotemResponse }
  | { type: 'TOTEMS_BULK_CREATED'; totems: AdminTotemResponse[] }
  | { type: 'TOTEM_UPDATED'; totem: AdminTotemResponse }
  | { type: 'TOTEM_DELETED'; totemId: string }
  | { type: 'TOTEM_HARD_DELETED'; totemId: string }
  | { type: 'TOTEM_RESTORED'; totem: AdminTotemResponse; totemId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER_STATUS'; status: string }
  | { type: 'TOGGLE_SELECTION'; totemId: string }
  | { type: 'SELECT_ALL'; totemIds: string[] }
  | { type: 'CLEAR_SELECTION' };

const initialState: AdminTotemsState = {
  totems: [],
  deletedTotems: [],
  selectedIds: new Set(),
  isLoading: false,
  isLoadingDeleted: false,
  searchQuery: '',
  filterStatus: 'all',
};

function adminTotemsReducer(state: AdminTotemsState, action: AdminTotemsAction): AdminTotemsState {
  switch (action.type) {
    case 'TOTEMS_LOADING':
      return { ...state, isLoading: true };
    case 'TOTEMS_LOADED':
      return { ...state, totems: action.totems, isLoading: false };
    case 'TOTEMS_FAILURE':
      return { ...state, isLoading: false };
    case 'DELETED_TOTEMS_LOADING':
      return { ...state, isLoadingDeleted: true };
    case 'DELETED_TOTEMS_LOADED':
      return { ...state, deletedTotems: action.totems, isLoadingDeleted: false };
    case 'DELETED_TOTEMS_FAILURE':
      return { ...state, isLoadingDeleted: false };
    case 'TOTEM_CREATED':
      return { ...state, totems: [action.totem, ...state.totems] };
    case 'TOTEMS_BULK_CREATED':
      return { ...state, totems: [...action.totems, ...state.totems] };
    case 'TOTEM_UPDATED':
      return {
        ...state,
        totems: state.totems.map((t) => (t.id === action.totem.id ? action.totem : t)),
      };
    case 'TOTEM_DELETED':
      return {
        ...state,
        totems: state.totems.filter((t) => t.id !== action.totemId),
        selectedIds: new Set([...state.selectedIds].filter((id) => id !== action.totemId)),
      };
    case 'TOTEM_HARD_DELETED':
      return {
        ...state,
        deletedTotems: state.deletedTotems.filter((t) => t.id !== action.totemId),
      };
    case 'TOTEM_RESTORED':
      return {
        ...state,
        deletedTotems: state.deletedTotems.filter((t) => t.id !== action.totemId),
        totems: [action.totem, ...state.totems],
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.status };
    case 'TOGGLE_SELECTION': {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(action.totemId)) {
        newSelectedIds.delete(action.totemId);
      } else {
        newSelectedIds.add(action.totemId);
      }
      return { ...state, selectedIds: newSelectedIds };
    }
    case 'SELECT_ALL':
      return { ...state, selectedIds: new Set(action.totemIds) };
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AdminTotemsContext = createContext<AdminTotemsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function AdminTotemsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminTotemsReducer, initialState);

  const fetchTotems = useCallback(async () => {
    dispatch({ type: 'TOTEMS_LOADING' });
    const response = await adminTotemsClient.listTotems();

    if (!response.success) {
      dispatch({ type: 'TOTEMS_FAILURE' });
      return;
    }

    dispatch({ type: 'TOTEMS_LOADED', totems: response.data });
  }, []);

  const fetchDeletedTotems = useCallback(async () => {
    dispatch({ type: 'DELETED_TOTEMS_LOADING' });
    const response = await adminTotemsClient.listDeletedTotems();

    if (!response.success) {
      dispatch({ type: 'DELETED_TOTEMS_FAILURE' });
      return;
    }

    dispatch({ type: 'DELETED_TOTEMS_LOADED', totems: response.data });
  }, []);

  const createTotem = useCallback(async (data: CreateAdminTotemRequest) => {
    const response = await adminTotemsClient.createTotem(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_CREATED', totem: response.data });
    return response.data;
  }, []);

  const bulkCreateTotems = useCallback(async (data: BulkCreateTotemsRequest) => {
    const response = await adminTotemsClient.bulkCreateTotems(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEMS_BULK_CREATED', totems: response.data });
    return response.data;
  }, []);

  const updateTotem = useCallback(async (totemId: string, data: UpdateAdminTotemRequest) => {
    const response = await adminTotemsClient.updateTotem(totemId, data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_UPDATED', totem: response.data });
    return response.data;
  }, []);

  const deleteTotem = useCallback(async (totemId: string) => {
    const response = await adminTotemsClient.deleteTotem(totemId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_DELETED', totemId });
  }, []);

  const hardDeleteTotem = useCallback(async (totemId: string) => {
    const response = await adminTotemsClient.hardDeleteTotem(totemId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_HARD_DELETED', totemId });
  }, []);

  const restoreTotem = useCallback(async (totemId: string) => {
    const response = await adminTotemsClient.restoreTotem(totemId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_RESTORED', totem: response.data, totemId });
    return response.data;
  }, []);

  const generateAccessToken = useCallback(async (totemId: string) => {
    const response = await adminTotemsClient.generateAccessToken(totemId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_UPDATED', totem: response.data });
    return response.data;
  }, []);

  const revokeAccessToken = useCallback(async (totemId: string) => {
    const response = await adminTotemsClient.revokeAccessToken(totemId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'TOTEM_UPDATED', totem: response.data });
    return response.data;
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, []);

  const setFilterStatus = useCallback((status: string) => {
    dispatch({ type: 'SET_FILTER_STATUS', status });
  }, []);

  const toggleSelection = useCallback((totemId: string) => {
    dispatch({ type: 'TOGGLE_SELECTION', totemId });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = state.totems.map((t) => t.id);
    dispatch({ type: 'SELECT_ALL', totemIds: allIds });
  }, [state.totems]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const filteredTotems = useMemo(() => {
    let result = state.totems;

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter((totem) => totem.name.toLowerCase().includes(query));
    }

    if (state.filterStatus && state.filterStatus !== 'all') {
      result = result.filter((totem) => totem.status === state.filterStatus);
    }

    return result;
  }, [state.totems, state.searchQuery, state.filterStatus]);

  const value = useMemo<AdminTotemsContextValue>(
    () => ({
      ...state,
      fetchTotems,
      fetchDeletedTotems,
      createTotem,
      bulkCreateTotems,
      updateTotem,
      deleteTotem,
      hardDeleteTotem,
      restoreTotem,
      generateAccessToken,
      revokeAccessToken,
      setSearchQuery,
      setFilterStatus,
      toggleSelection,
      selectAll,
      clearSelection,
      filteredTotems,
    }),
    [
      state,
      fetchTotems,
      fetchDeletedTotems,
      createTotem,
      bulkCreateTotems,
      updateTotem,
      deleteTotem,
      hardDeleteTotem,
      restoreTotem,
      generateAccessToken,
      revokeAccessToken,
      setSearchQuery,
      setFilterStatus,
      toggleSelection,
      selectAll,
      clearSelection,
      filteredTotems,
    ],
  );

  return <AdminTotemsContext.Provider value={value}>{children}</AdminTotemsContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useAdminTotems(): AdminTotemsContextValue {
  const context = useContext(AdminTotemsContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useAdminTotems must be used within an AdminTotemsProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
