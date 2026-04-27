import type { ApiResponse } from './api-response';
import { httpClient } from './http-client';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export abstract class BaseClient {
  protected get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return httpClient.get<T>(url, options);
  }

  protected post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return httpClient.post<T>(url, body, options);
  }

  protected put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return httpClient.put<T>(url, body, options);
  }

  protected patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return httpClient.patch<T>(url, body, options);
  }

  protected delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return httpClient.delete<T>(url, options);
  }
}
