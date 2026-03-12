'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type {
  AdminFeatureResponse,
  AdminPlanCategoryResponse,
  AdminPlanFeatureResponse,
  AdminPlanResponse,
} from '@/core/application/client-services/admin-plans-client.service';
import { adminPlansClient } from '@/core/application/client-services/admin-plans-client.service';
import type { CreateFeatureRequest, UpdateFeatureRequest } from '@/core/communication/requests/feature';
import type { CreatePlanRequest, UpdatePlanRequest } from '@/core/communication/requests/plan';
import type { CreatePlanCategoryRequest, UpdatePlanCategoryRequest } from '@/core/communication/requests/plan-category';
import { AppError, ErrorCode } from '@/core/errors';

// ── Types ─────────────────────────────────────────────────────────

interface AdminPlansState {
  plans: AdminPlanResponse[];
  categories: AdminPlanCategoryResponse[];
  features: AdminFeatureResponse[];
  isLoadingPlans: boolean;
  isLoadingCategories: boolean;
  isLoadingFeatures: boolean;
  searchQuery: string;
  filterStatus: string;
  filterCategory: string;
}

interface AdminPlansContextValue extends AdminPlansState {
  fetchPlans: () => Promise<void>;
  createPlan: (data: CreatePlanRequest) => Promise<AdminPlanResponse>;
  updatePlan: (id: string, data: UpdatePlanRequest) => Promise<AdminPlanResponse>;
  deletePlan: (id: string) => Promise<void>;
  updatePlanFeatures: (
    planId: string,
    features: { featureId: string; value: string }[],
  ) => Promise<AdminPlanFeatureResponse[]>;

  fetchCategories: () => Promise<void>;
  createCategory: (data: CreatePlanCategoryRequest) => Promise<AdminPlanCategoryResponse>;
  updateCategory: (id: string, data: UpdatePlanCategoryRequest) => Promise<AdminPlanCategoryResponse>;
  deleteCategory: (id: string) => Promise<void>;

  fetchFeatures: () => Promise<void>;
  createFeature: (data: CreateFeatureRequest) => Promise<AdminFeatureResponse>;
  updateFeature: (id: string, data: UpdateFeatureRequest) => Promise<AdminFeatureResponse>;
  deleteFeature: (id: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterCategory: (category: string) => void;
  filteredPlans: AdminPlanResponse[];
}

// ── Reducer ───────────────────────────────────────────────────────

type AdminPlansAction =
  | { type: 'PLANS_LOADING' }
  | { type: 'PLANS_LOADED'; plans: AdminPlanResponse[] }
  | { type: 'PLANS_FAILURE' }
  | { type: 'PLAN_CREATED'; plan: AdminPlanResponse }
  | { type: 'PLAN_UPDATED'; plan: AdminPlanResponse }
  | { type: 'PLAN_DELETED'; planId: string }
  | { type: 'CATEGORIES_LOADING' }
  | { type: 'CATEGORIES_LOADED'; categories: AdminPlanCategoryResponse[] }
  | { type: 'CATEGORIES_FAILURE' }
  | { type: 'CATEGORY_CREATED'; category: AdminPlanCategoryResponse }
  | { type: 'CATEGORY_UPDATED'; category: AdminPlanCategoryResponse }
  | { type: 'CATEGORY_DELETED'; categoryId: string }
  | { type: 'FEATURES_LOADING' }
  | { type: 'FEATURES_LOADED'; features: AdminFeatureResponse[] }
  | { type: 'FEATURES_FAILURE' }
  | { type: 'FEATURE_CREATED'; feature: AdminFeatureResponse }
  | { type: 'FEATURE_UPDATED'; feature: AdminFeatureResponse }
  | { type: 'FEATURE_DELETED'; featureId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER_STATUS'; status: string }
  | { type: 'SET_FILTER_CATEGORY'; category: string };

const initialState: AdminPlansState = {
  plans: [],
  categories: [],
  features: [],
  isLoadingPlans: false,
  isLoadingCategories: false,
  isLoadingFeatures: false,
  searchQuery: '',
  filterStatus: 'all',
  filterCategory: 'all',
};

function adminPlansReducer(state: AdminPlansState, action: AdminPlansAction): AdminPlansState {
  switch (action.type) {
    case 'PLANS_LOADING':
      return { ...state, isLoadingPlans: true };
    case 'PLANS_LOADED':
      return { ...state, plans: action.plans, isLoadingPlans: false };
    case 'PLANS_FAILURE':
      return { ...state, isLoadingPlans: false };
    case 'PLAN_CREATED':
      return { ...state, plans: [action.plan, ...state.plans] };
    case 'PLAN_UPDATED':
      return {
        ...state,
        plans: state.plans.map((p) => (p.id === action.plan.id ? action.plan : p)),
      };
    case 'PLAN_DELETED':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.planId) };

    case 'CATEGORIES_LOADING':
      return { ...state, isLoadingCategories: true };
    case 'CATEGORIES_LOADED':
      return { ...state, categories: action.categories, isLoadingCategories: false };
    case 'CATEGORIES_FAILURE':
      return { ...state, isLoadingCategories: false };
    case 'CATEGORY_CREATED':
      return { ...state, categories: [action.category, ...state.categories] };
    case 'CATEGORY_UPDATED':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.category.id ? action.category : c)),
      };
    case 'CATEGORY_DELETED':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.categoryId) };

    case 'FEATURES_LOADING':
      return { ...state, isLoadingFeatures: true };
    case 'FEATURES_LOADED':
      return { ...state, features: action.features, isLoadingFeatures: false };
    case 'FEATURES_FAILURE':
      return { ...state, isLoadingFeatures: false };
    case 'FEATURE_CREATED':
      return { ...state, features: [action.feature, ...state.features] };
    case 'FEATURE_UPDATED':
      return {
        ...state,
        features: state.features.map((f) => (f.id === action.feature.id ? action.feature : f)),
      };
    case 'FEATURE_DELETED':
      return { ...state, features: state.features.filter((f) => f.id !== action.featureId) };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.status };
    case 'SET_FILTER_CATEGORY':
      return { ...state, filterCategory: action.category };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AdminPlansContext = createContext<AdminPlansContextValue | null>(null);

export function AdminPlansProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminPlansReducer, initialState);

  // ── Plans ─────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    dispatch({ type: 'PLANS_LOADING' });
    const res = await adminPlansClient.listPlans();
    if (!res.success) {
      dispatch({ type: 'PLANS_FAILURE' });
      return;
    }
    dispatch({ type: 'PLANS_LOADED', plans: res.data });
  }, []);

  const createPlan = useCallback(async (data: CreatePlanRequest): Promise<AdminPlanResponse> => {
    const res = await adminPlansClient.createPlan(data);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_AVAILABLE,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'PLAN_CREATED', plan: res.data });
    return res.data;
  }, []);

  const updatePlan = useCallback(async (id: string, data: UpdatePlanRequest): Promise<AdminPlanResponse> => {
    const res = await adminPlansClient.updatePlan(id, data);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_FOUND,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'PLAN_UPDATED', plan: res.data });
    return res.data;
  }, []);

  const deletePlan = useCallback(async (id: string): Promise<void> => {
    const res = await adminPlansClient.deletePlan(id);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_FOUND,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'PLAN_DELETED', planId: id });
  }, []);

  const updatePlanFeatures = useCallback(
    async (planId: string, features: { featureId: string; value: string }[]): Promise<AdminPlanFeatureResponse[]> => {
      const res = await adminPlansClient.updatePlanFeatures(planId, features);
      if (!res.success) {
        throw new AppError({
          code: ErrorCode.PLAN_FEATURE_NOT_FOUND,
          message: res.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }
      return res.data;
    },
    [],
  );

  // ── Categories ────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    dispatch({ type: 'CATEGORIES_LOADING' });
    const res = await adminPlansClient.listCategories();
    if (!res.success) {
      dispatch({ type: 'CATEGORIES_FAILURE' });
      return;
    }
    dispatch({ type: 'CATEGORIES_LOADED', categories: res.data });
  }, []);

  const createCategory = useCallback(async (data: CreatePlanCategoryRequest): Promise<AdminPlanCategoryResponse> => {
    const res = await adminPlansClient.createCategory(data);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'CATEGORY_CREATED', category: res.data });
    return res.data;
  }, []);

  const updateCategory = useCallback(
    async (id: string, data: UpdatePlanCategoryRequest): Promise<AdminPlanCategoryResponse> => {
      const res = await adminPlansClient.updateCategory(id, data);
      if (!res.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: res.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }
      dispatch({ type: 'CATEGORY_UPDATED', category: res.data });
      return res.data;
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const res = await adminPlansClient.deleteCategory(id);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'CATEGORY_DELETED', categoryId: id });
  }, []);

  // ── Features ──────────────────────────────────────────────────

  const fetchFeatures = useCallback(async () => {
    dispatch({ type: 'FEATURES_LOADING' });
    const res = await adminPlansClient.listFeatures();
    if (!res.success) {
      dispatch({ type: 'FEATURES_FAILURE' });
      return;
    }
    dispatch({ type: 'FEATURES_LOADED', features: res.data });
  }, []);

  const createFeature = useCallback(async (data: CreateFeatureRequest): Promise<AdminFeatureResponse> => {
    const res = await adminPlansClient.createFeature(data);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.FEATURE_ALREADY_EXISTS,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'FEATURE_CREATED', feature: res.data });
    return res.data;
  }, []);

  const updateFeature = useCallback(async (id: string, data: UpdateFeatureRequest): Promise<AdminFeatureResponse> => {
    const res = await adminPlansClient.updateFeature(id, data);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.FEATURE_NOT_FOUND,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'FEATURE_UPDATED', feature: res.data });
    return res.data;
  }, []);

  const deleteFeature = useCallback(async (id: string): Promise<void> => {
    const res = await adminPlansClient.deleteFeature(id);
    if (!res.success) {
      throw new AppError({
        code: ErrorCode.FEATURE_NOT_FOUND,
        message: res.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }
    dispatch({ type: 'FEATURE_DELETED', featureId: id });
  }, []);

  // ── Filters ───────────────────────────────────────────────────

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, []);

  const setFilterStatus = useCallback((status: string) => {
    dispatch({ type: 'SET_FILTER_STATUS', status });
  }, []);

  const setFilterCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_FILTER_CATEGORY', category });
  }, []);

  const filteredPlans = useMemo(() => {
    return state.plans.filter((plan) => {
      const matchesSearch =
        !state.searchQuery ||
        plan.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesStatus =
        state.filterStatus === 'all' ||
        (state.filterStatus === 'active' && plan.isActive) ||
        (state.filterStatus === 'inactive' && !plan.isActive);
      const matchesCategory = state.filterCategory === 'all' || plan.categoryId === state.filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [state.plans, state.searchQuery, state.filterStatus, state.filterCategory]);

  const value = useMemo<AdminPlansContextValue>(
    () => ({
      ...state,
      fetchPlans,
      createPlan,
      updatePlan,
      deletePlan,
      updatePlanFeatures,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      fetchFeatures,
      createFeature,
      updateFeature,
      deleteFeature,
      setSearchQuery,
      setFilterStatus,
      setFilterCategory,
      filteredPlans,
    }),
    [
      state,
      fetchPlans,
      createPlan,
      updatePlan,
      deletePlan,
      updatePlanFeatures,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      fetchFeatures,
      createFeature,
      updateFeature,
      deleteFeature,
      setSearchQuery,
      setFilterStatus,
      setFilterCategory,
      filteredPlans,
    ],
  );

  return <AdminPlansContext.Provider value={value}>{children}</AdminPlansContext.Provider>;
}

export function useAdminPlans() {
  const ctx = useContext(AdminPlansContext);
  if (!ctx) throw new Error('useAdminPlans must be used within AdminPlansProvider');
  return ctx;
}
