// src/lib/http/axios-instance.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { ErrorMapper } from '../errors/error-mapper';
import { Logger } from '../logger/logger';

const MAX_RETRIES = 2;

const api: AxiosInstance = axios.create({
  baseURL: '/api', // ou seu endpoint real
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry automático
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as AxiosRequestConfig & { retryCount?: number };
  config.retryCount = config.retryCount || 0;

  if (config.retryCount < MAX_RETRIES) {
    config.retryCount += 1;
    Logger.warn(`Retrying request (${config.retryCount}) ${config.url}`);
    return api(config);
  }

  return Promise.reject(error);
});

// Request interceptor (ex: adicionar token)
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Logger.error('Request error', error);
    return Promise.reject(error);
  },
);

// Response interceptor (tratar erro global)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = ErrorMapper.toMessage(error);
    Logger.error(message, { error: String(error) });
    return Promise.reject(error);
  },
);

export default api;
