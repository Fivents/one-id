import { LogLevel } from '../types';

export const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // cinza
  info: '\x1b[34m', // azul
  warn: '\x1b[33m', // amarelo
  error: '\x1b[31m', // vermelho
  fatal: '\x1b[41m', // fundo vermelho
};

export const RESET = '\x1b[0m';
