import type { ApiResponse } from '../base/api-response';

export interface TotemAIConfig {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
  recommendedEmbeddingModel: string;
  recommendedDetectorModel: string;
}

export interface TotemLoginResponse {
  token: string;
  totem: {
    id: string;
    name: string;
  };
  activeEvent: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
  totemEventSubscriptionId: string;
  aiConfig: TotemAIConfig;
}

export interface TotemSessionResponse {
  sessionId: string;
  expiresAt: string;
  totem: {
    id: string;
    name: string;
  };
  activeEvent: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
  totemEventSubscriptionId: string;
  aiConfig: TotemAIConfig;
}

export interface TotemCheckInResponse {
  id: string;
  confidence: number;
  checkedInAt: string;
  eventParticipantId: string;
  totemEventSubscriptionId: string;
  participant: {
    name: string;
    company: string | null;
    jobTitle: string | null;
    imageUrl: string | null;
  };
}

const TOTEM_TOKEN_KEY = 'oneid.totem.token';

interface RequestOptions {
  timeoutMs?: number;
}

function mapFailure(error: unknown): ApiResponse<never> {
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  return {
    success: false,
    error: {
      code: 'UNEXPECTED_ERROR',
      message,
    },
  };
}

async function request<T>(url: string, init: RequestInit, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: typeof payload?.code === 'string' ? payload.code : 'REQUEST_FAILED',
          message: typeof payload?.error === 'string' ? payload.error : 'Request failed.',
        },
      };
    }

    return { success: true, data: payload as T };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Server response timeout.',
        },
      };
    }

    return mapFailure(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getStoredTotemToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOTEM_TOKEN_KEY);
}

function setStoredTotemToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOTEM_TOKEN_KEY, token);
}

export function clearTotemToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOTEM_TOKEN_KEY);
}

export async function loginTotem(key: string): Promise<ApiResponse<TotemLoginResponse>> {
  const response = await request<TotemLoginResponse>('/api/totem/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  }, {
    timeoutMs: 12000,
  });

  if (response.success) {
    setStoredTotemToken(response.data.token);
  }

  return response;
}

export async function getTotemSession(token?: string): Promise<ApiResponse<TotemSessionResponse>> {
  const activeToken = token ?? getStoredTotemToken();

  if (!activeToken) {
    return {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Totem token not found.',
      },
    };
  }

  return request<TotemSessionResponse>('/api/totem/session', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${activeToken}`,
    },
  }, {
    timeoutMs: 8000,
  });
}

export async function sendCheckIn(
  payload: {
    imageDataUrl?: string;
    embedding?: number[];
    faceCount: number;
    livenessScore?: number;
    blinkDetected?: boolean;
  },
  token?: string,
): Promise<ApiResponse<TotemCheckInResponse>> {
  const activeToken = token ?? getStoredTotemToken();

  if (!activeToken) {
    return {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Totem token not found.',
      },
    };
  }

  return request<TotemCheckInResponse>('/api/totem/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeToken}`,
    },
    body: JSON.stringify(payload),
  }, {
    timeoutMs: 7000,
  });
}

export async function getEventAIConfig(eventId: string, token?: string): Promise<ApiResponse<TotemAIConfig>> {
  const activeToken = token ?? getStoredTotemToken();

  if (!activeToken) {
    return {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Totem token not found.',
      },
    };
  }

  return request<TotemAIConfig>(`/api/events/${encodeURIComponent(eventId)}/ai-config`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${activeToken}`,
    },
  }, {
    timeoutMs: 10000,
  });
}

export function getTotemToken(): string | null {
  return getStoredTotemToken();
}
