import type { ApiResponse } from './api-response';
import { mapResponseErrorBody, mapToApiFailure } from './error-mapper';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const BASE_URL = '/api';
const DEFAULT_TIMEOUT_MS = 20_000;

function getRequestTimeoutMs(override?: number): number {
  const timeoutMs = override ?? DEFAULT_TIMEOUT_MS;

  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return timeoutMs;
}

async function request<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const timeoutMs = getRequestTimeoutMs(options?.timeoutMs);
  const timeoutController = new AbortController();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let removeExternalAbortListener: (() => void) | null = null;

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);
  }

  if (options?.signal) {
    if (options.signal.aborted) {
      timeoutController.abort();
    } else {
      const onExternalAbort = () => {
        timeoutController.abort();
      };

      options.signal.addEventListener('abort', onExternalAbort, { once: true });
      removeExternalAbortListener = () => {
        options.signal?.removeEventListener('abort', onExternalAbort);
      };
    }
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include',
      signal: timeoutController.signal,
    };

    if (body !== undefined && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, init);

    if (response.status === 204) {
      return { success: true, data: undefined as T };
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }

    if (!response.ok) {
      return mapResponseErrorBody(responseBody);
    }

    if (method !== 'GET' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fivents-sync'));

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fivents-sync-channel');
        bc.postMessage({ type: 'mutation' });
        bc.close();
      }
    }

    return { success: true, data: responseBody as T };
  } catch (error) {
    return mapToApiFailure(error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (removeExternalAbortListener) {
      removeExternalAbortListener();
    }
  }
}

export const httpClient = {
  get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('GET', url, undefined, options);
  },

  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('POST', url, body, options);
  },

  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PUT', url, body, options);
  },

  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PATCH', url, body, options);
  },

  delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('DELETE', url, undefined, options);
  },
};
