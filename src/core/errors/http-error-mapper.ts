import { AppError } from './app-error';
import { ErrorCode } from './error-codes';

interface HttpErrorResponse {
  status: number;
  body: {
    code: string;
    message: string;
  };
}

export function mapErrorToHttpResponse(error: unknown): HttpErrorResponse {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus,
      body: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Unexpected error.',
    },
  };
}
