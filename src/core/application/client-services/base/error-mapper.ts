import type { ApiFailure } from './api-response';

interface ApiErrorBody {
  code?: string;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string; code?: string }>;
}

export function mapToApiFailure(error: unknown): ApiFailure {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server.',
      },
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out.',
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred.',
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    },
  };
}

export function mapResponseErrorBody(body: unknown): ApiFailure {
  const parsed = body as ApiErrorBody | undefined;

  const code = parsed?.code ?? 'UNKNOWN_ERROR';
  const message = parsed?.message ?? parsed?.error ?? 'An unexpected error occurred.';
  const details = parsed?.details;

  // Preserve extra fields as meta for special error handling
  const meta: Record<string, unknown> = {};
  if (body && typeof body === 'object') {
    for (const [key, value] of Object.entries(body)) {
      if (key !== 'code' && key !== 'message' && key !== 'error' && key !== 'details') {
        meta[key] = value;
      }
    }
  }

  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(Object.keys(meta).length > 0 ? { meta } : {}),
    },
  };
}
