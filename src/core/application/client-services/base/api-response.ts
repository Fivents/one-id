export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    meta?: Record<string, unknown>;
    details?: Array<{ field: string; message: string; code?: string }>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
