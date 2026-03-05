'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { NotificationResponse } from '@/core/application/client-services';
import { AppError, ErrorCode } from '@/core/errors';

import { notificationsClient } from '../client-services';

// ── Types ─────────────────────────────────────────────────────────

interface NotificationsState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationsContextValue extends NotificationsState {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────

type NotificationsAction =
  | { type: 'NOTIFICATIONS_LOADING' }
  | { type: 'NOTIFICATIONS_LOADED'; notifications: NotificationResponse[] }
  | { type: 'NOTIFICATIONS_FAILURE' }
  | { type: 'NOTIFICATION_READ'; notificationId: string; notification: NotificationResponse }
  | { type: 'ALL_NOTIFICATIONS_READ' }
  | { type: 'NOTIFICATION_DELETED'; notificationId: string };

function countUnread(notifications: NotificationResponse[]): number {
  return notifications.filter((n) => !n.readAt).length;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
};

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case 'NOTIFICATIONS_LOADING':
      return { ...state, isLoading: true };
    case 'NOTIFICATIONS_LOADED': {
      return {
        notifications: action.notifications,
        unreadCount: countUnread(action.notifications),
        isLoading: false,
      };
    }
    case 'NOTIFICATIONS_FAILURE':
      return { ...state, isLoading: false };
    case 'NOTIFICATION_READ': {
      const updated = state.notifications.map((n) => (n.id === action.notificationId ? action.notification : n));
      return { notifications: updated, unreadCount: countUnread(updated), isLoading: false };
    }
    case 'ALL_NOTIFICATIONS_READ': {
      const allRead = state.notifications.map((n) => ({ ...n, readAt: n.readAt ?? new Date() }));
      return { notifications: allRead, unreadCount: 0, isLoading: false };
    }
    case 'NOTIFICATION_DELETED': {
      const filtered = state.notifications.filter((n) => n.id !== action.notificationId);
      return { notifications: filtered, unreadCount: countUnread(filtered), isLoading: false };
    }
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState);

  const fetchNotifications = useCallback(async () => {
    dispatch({ type: 'NOTIFICATIONS_LOADING' });
    const response = await notificationsClient.listNotifications();

    if (!response.success) {
      dispatch({ type: 'NOTIFICATIONS_FAILURE' });
      return;
    }

    dispatch({ type: 'NOTIFICATIONS_LOADED', notifications: response.data });
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    const response = await notificationsClient.markAsRead(notificationId);

    if (!response.success) return;

    dispatch({ type: 'NOTIFICATION_READ', notificationId, notification: response.data });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = state.notifications.filter((n) => !n.readAt);

    await Promise.allSettled(unread.map((n) => notificationsClient.markAsRead(n.id)));

    dispatch({ type: 'ALL_NOTIFICATIONS_READ' });
  }, [state.notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const response = await notificationsClient.deleteNotification(notificationId);

    if (!response.success) return;

    dispatch({ type: 'NOTIFICATION_DELETED', notificationId });
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [state, fetchNotifications, markAsRead, markAllAsRead, deleteNotification],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useNotifications must be used within a NotificationsProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
