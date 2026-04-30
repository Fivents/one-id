export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogMeta = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  scope?: string;
  meta?: LogMeta;
}
