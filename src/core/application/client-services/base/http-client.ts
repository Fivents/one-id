import type { ApiResponse } from './api-response';
import { mapResponseErrorBody, mapToApiFailure } from './error-mapper';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const BASE_URL = '/api';

async function request<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include',
      signal: options?.signal,
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

    return { success: true, data: responseBody as T };
  } catch (error) {
    return mapToApiFailure(error);
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
