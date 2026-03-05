import { isAxiosError } from 'axios';

import { AppError } from './app-error';

export class ErrorMapper {
  static toMessage(err: unknown): string {
    if (err instanceof AppError) return err.message;

    if (err instanceof Error) return err.message;

    if (isAxiosError(err)) {
      if (err.response) {
        const status = err.response.status;
        const statusText = err.response.statusText || '';
        const message = err.response.data?.message || err.message || '';
        return message ? `${status} ${statusText}: ${message}` : `${status} ${statusText}`;
      }
      if (err.request) {
        return 'No response received from server.';
      }
      return err.message;
    }

    if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if ('status' in e && 'statusText' in e) {
        return `${e.status} ${e.statusText}`;
      }
    }

    return 'An unknown error occurred.';
  }
}
