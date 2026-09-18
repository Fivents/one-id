import { AppError } from '../app-error';
import { ErrorCode } from '../error-codes';

/**
 * RFC 9457 Problem Details, as returned by the Sympla public API on failure.
 */
export interface SymplaProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  violations?: Array<{ field?: string; message?: string }>;
}

interface SymplaErrorMapping {
  code: ErrorCode;
  httpStatus: number;
  message: string;
  retryable: boolean;
}

function mapUpstreamStatus(upstreamStatus: number): SymplaErrorMapping {
  switch (upstreamStatus) {
    case 401:
      return {
        code: ErrorCode.SYMPLA_UNAUTHORIZED,
        httpStatus: 401,
        message: 'Token da Sympla inválido ou revogado. Reconecte a integração.',
        retryable: false,
      };
    case 403:
      return {
        code: ErrorCode.SYMPLA_FORBIDDEN,
        httpStatus: 403,
        message: 'O token da Sympla não tem permissão para acessar este evento.',
        retryable: false,
      };
    case 404:
      return {
        code: ErrorCode.SYMPLA_NOT_FOUND,
        httpStatus: 404,
        message: 'Registro não encontrado na Sympla.',
        retryable: false,
      };
    case 410:
      return {
        code: ErrorCode.SYMPLA_QR_EXPIRED,
        httpStatus: 410,
        message: 'QR code expirado na Sympla. Peça ao participante para atualizar o ingresso.',
        retryable: false,
      };
    case 422:
      return {
        code: ErrorCode.SYMPLA_VALIDATION,
        httpStatus: 422,
        message: 'A Sympla recusou os dados enviados.',
        retryable: false,
      };
    case 429:
      return {
        code: ErrorCode.SYMPLA_RATE_LIMITED,
        httpStatus: 429,
        message: 'Limite de requisições da Sympla atingido. A sincronização será retomada automaticamente.',
        retryable: true,
      };
    default:
      return {
        code: ErrorCode.SYMPLA_UNAVAILABLE,
        httpStatus: 502,
        message: 'A Sympla está indisponível no momento. A sincronização será retomada automaticamente.',
        retryable: upstreamStatus >= 500,
      };
  }
}

/**
 * Carries the upstream status so the job queue can decide between retry and give-up
 * without re-parsing the response. Never carries the s_token.
 */
export class SymplaApiError extends AppError {
  public readonly upstreamStatus: number;
  public readonly retryable: boolean;
  public readonly problem?: SymplaProblemDetails;

  constructor(upstreamStatus: number, problem?: SymplaProblemDetails, context?: Record<string, unknown>) {
    const mapping = mapUpstreamStatus(upstreamStatus);

    // The 422 detail is the only upstream copy worth surfacing verbatim — it names the
    // offending field, which our generic message cannot.
    const detail = problem?.detail?.trim();
    const message = upstreamStatus === 422 && detail ? `${mapping.message} ${detail}` : mapping.message;

    super({
      code: mapping.code,
      message,
      httpStatus: mapping.httpStatus,
      level: mapping.retryable ? 'warning' : 'error',
      context: {
        ...context,
        upstreamStatus,
        ...(problem?.title ? { symplaTitle: problem.title } : {}),
        ...(problem?.violations?.length ? { symplaViolations: problem.violations } : {}),
      },
    });

    this.upstreamStatus = upstreamStatus;
    this.retryable = mapping.retryable;
    this.problem = problem;
  }
}
