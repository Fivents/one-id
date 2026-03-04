import { ErrorLevel } from '../utils/types';

interface AppErrorProps {
  message: string;
  level: ErrorLevel;
  metadata?: Record<string, unknown>;
}

export abstract class AppError extends Error {
  public abstract code: string;
  public level: ErrorLevel;
  public metadata?: Record<string, unknown>;

  constructor(props: AppErrorProps) {
    super(props.message);
    this.name = this.constructor.name;
    this.level = props.level;
    this.metadata = props.metadata;

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}
