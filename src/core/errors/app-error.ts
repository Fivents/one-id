import type { ErrorLevel } from '../utils/types';

import { ErrorCode } from './error-codes';

interface AppErrorProps {
  code: ErrorCode;
  message: string;
  httpStatus: number;
  level: ErrorLevel;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly level: ErrorLevel;
  public readonly context?: Record<string, unknown>;

  constructor(props: AppErrorProps) {
    super(props.message);
    this.name = this.constructor.name;
    this.code = props.code;
    this.httpStatus = props.httpStatus;
    this.level = props.level;
    this.context = props.context;

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      level: this.level,
      context: this.context,
    };
  }
}
