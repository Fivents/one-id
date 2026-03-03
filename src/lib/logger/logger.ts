import { LogEntry, LogLevel, LogMeta } from '../types';

import { COLORS, RESET } from './colors';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const shouldLog = (level: LogLevel) => {
  if (NODE_ENV === 'production') {
    return level !== 'debug';
  }
  return true;
};

const format = (entry: LogEntry) => {
  const color = COLORS[entry.level];
  const scope = entry.scope ? `[${entry.scope}] ` : '';
  return `${color}[${entry.level.toUpperCase()}] ${entry.timestamp} ` + `${scope}${entry.message}${RESET}`;
};

const write = (entry: LogEntry) => {
  if (!shouldLog(entry.level)) return;

  const output = format(entry);

  if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(output, entry.meta ?? '');
  } else if (entry.level === 'warn') {
    console.warn(output, entry.meta ?? '');
  } else {
    console.info(output, entry.meta ?? '');
  }
};

export const Logger = {
  debug(message: string, meta?: LogMeta, scope?: string) {
    write({
      level: 'debug',
      message,
      meta,
      scope,
      timestamp: new Date().toISOString(),
    });
  },

  info(message: string, meta?: LogMeta, scope?: string) {
    write({
      level: 'info',
      message,
      meta,
      scope,
      timestamp: new Date().toISOString(),
    });
  },

  warn(message: string, meta?: LogMeta, scope?: string) {
    write({
      level: 'warn',
      message,
      meta,
      scope,
      timestamp: new Date().toISOString(),
    });
  },

  error(message: string, meta?: LogMeta, scope?: string) {
    write({
      level: 'error',
      message,
      meta,
      scope,
      timestamp: new Date().toISOString(),
    });
  },

  fatal(message: string, meta?: LogMeta, scope?: string) {
    write({
      level: 'fatal',
      message,
      meta,
      scope,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * @example
   * const authLogger = Logger.scoped('AuthService');
   * authLogger.warn('Token expirado', { userId: 123 });
   * authLogger.error('Falha ao autenticar', { ip: '10.0.0.1' });
   */
  scoped(scope: string) {
    return {
      debug: (msg: string, meta?: LogMeta) => Logger.debug(msg, meta, scope),
      info: (msg: string, meta?: LogMeta) => Logger.info(msg, meta, scope),
      warn: (msg: string, meta?: LogMeta) => Logger.warn(msg, meta, scope),
      error: (msg: string, meta?: LogMeta) => Logger.error(msg, meta, scope),
      fatal: (msg: string, meta?: LogMeta) => Logger.fatal(msg, meta, scope),
    };
  },
} as const;
