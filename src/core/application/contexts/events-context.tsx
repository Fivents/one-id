'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import type { CreateEventRequest, UpdateEventRequest } from '@/core/communication/requests/event';
import type { EventSummaryResponse } from '@/core/communication/responses/event';
import { AppError, ErrorCode } from '@/core/errors';

import { eventsClient } from '../client-services';

interface EventsState {
  events: EventSummaryResponse[];
  isLoading: boolean;
}

interface EventsContextValue extends EventsState {
  fetchEvents: (organizationId: string) => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<EventSummaryResponse>;
  updateEvent: (eventId: string, data: UpdateEventRequest) => Promise<EventSummaryResponse>;
  deleteEvent: (eventId: string) => Promise<void>;
  publishEvent: (eventId: string) => Promise<void>;
  activateEvent: (eventId: string) => Promise<void>;
  completeEvent: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
}

type EventsAction =
  | { type: 'EVENTS_LOADING' }
  | { type: 'EVENTS_LOADED'; events: EventSummaryResponse[] }
  | { type: 'EVENTS_FAILURE' }
  | { type: 'EVENT_CREATED'; event: EventSummaryResponse }
  | { type: 'EVENT_UPDATED'; event: EventSummaryResponse }
  | { type: 'EVENT_DELETED'; eventId: string };

const initialState: EventsState = {
  events: [],
  isLoading: false,
};

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'EVENTS_LOADING':
      return { ...state, isLoading: true };
    case 'EVENTS_LOADED':
      return { ...state, events: action.events, isLoading: false };
    case 'EVENTS_FAILURE':
      return { ...state, isLoading: false };
    case 'EVENT_CREATED':
      return { ...state, events: [action.event, ...state.events] };
    case 'EVENT_UPDATED':
      return {
        ...state,
        events: state.events.map((event) => (event.id === action.event.id ? action.event : event)),
      };
    case 'EVENT_DELETED':
      return { ...state, events: state.events.filter((event) => event.id !== action.eventId) };
    default:
      return state;
  }
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, initialState);

  const fetchEvents = useCallback(async (organizationId: string) => {
    dispatch({ type: 'EVENTS_LOADING' });
    const response = await eventsClient.getEventsByOrganization(organizationId);

    if (!response.success) {
      dispatch({ type: 'EVENTS_FAILURE' });
      return;
    }

    dispatch({ type: 'EVENTS_LOADED', events: response.data });
  }, []);

  const createEvent = useCallback(async (data: CreateEventRequest) => {
    const response = await eventsClient.createEvent(data);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    const enriched = {
      ...response.data,
      participantsCount: 0,
      checkInsCount: 0,
      totemsCount: 0,
    };

    dispatch({ type: 'EVENT_CREATED', event: enriched });
    return enriched;
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, data: UpdateEventRequest) => {
      const response = await eventsClient.updateEvent(eventId, data);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      const updated = {
        ...response.data,
        participantsCount: state.events.find((event) => event.id === eventId)?.participantsCount ?? 0,
        checkInsCount: state.events.find((event) => event.id === eventId)?.checkInsCount ?? 0,
        totemsCount: state.events.find((event) => event.id === eventId)?.totemsCount ?? 0,
      };

      dispatch({ type: 'EVENT_UPDATED', event: updated });
      return updated;
    },
    [state.events],
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    const response = await eventsClient.deleteEvent(eventId);

    if (!response.success) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: response.error.message,
        httpStatus: 400,
        level: 'warning',
      });
    }

    dispatch({ type: 'EVENT_DELETED', eventId });
  }, []);

  const publishEvent = useCallback(
    async (eventId: string) => {
      const response = await eventsClient.publishEvent(eventId);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      const updated = {
        ...response.data,
        participantsCount: state.events.find((event) => event.id === eventId)?.participantsCount ?? 0,
        checkInsCount: state.events.find((event) => event.id === eventId)?.checkInsCount ?? 0,
        totemsCount: state.events.find((event) => event.id === eventId)?.totemsCount ?? 0,
      };

      dispatch({ type: 'EVENT_UPDATED', event: updated });
    },
    [state.events],
  );

  const activateEvent = useCallback(
    async (eventId: string) => {
      const response = await eventsClient.activateEvent(eventId);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      const updated = {
        ...response.data,
        participantsCount: state.events.find((event) => event.id === eventId)?.participantsCount ?? 0,
        checkInsCount: state.events.find((event) => event.id === eventId)?.checkInsCount ?? 0,
        totemsCount: state.events.find((event) => event.id === eventId)?.totemsCount ?? 0,
      };

      dispatch({ type: 'EVENT_UPDATED', event: updated });
    },
    [state.events],
  );

  const completeEvent = useCallback(
    async (eventId: string) => {
      const response = await eventsClient.completeEvent(eventId);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      const updated = {
        ...response.data,
        participantsCount: state.events.find((event) => event.id === eventId)?.participantsCount ?? 0,
        checkInsCount: state.events.find((event) => event.id === eventId)?.checkInsCount ?? 0,
        totemsCount: state.events.find((event) => event.id === eventId)?.totemsCount ?? 0,
      };

      dispatch({ type: 'EVENT_UPDATED', event: updated });
    },
    [state.events],
  );

  const cancelEvent = useCallback(
    async (eventId: string) => {
      const response = await eventsClient.cancelEvent(eventId);

      if (!response.success) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.error.message,
          httpStatus: 400,
          level: 'warning',
        });
      }

      const updated = {
        ...response.data,
        participantsCount: state.events.find((event) => event.id === eventId)?.participantsCount ?? 0,
        checkInsCount: state.events.find((event) => event.id === eventId)?.checkInsCount ?? 0,
        totemsCount: state.events.find((event) => event.id === eventId)?.totemsCount ?? 0,
      };

      dispatch({ type: 'EVENT_UPDATED', event: updated });
    },
    [state.events],
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      ...state,
      fetchEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      publishEvent,
      activateEvent,
      completeEvent,
      cancelEvent,
    }),
    [
      state,
      fetchEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      publishEvent,
      activateEvent,
      completeEvent,
      cancelEvent,
    ],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsContextValue {
  const context = useContext(EventsContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'useEvents must be used within an EventsProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
