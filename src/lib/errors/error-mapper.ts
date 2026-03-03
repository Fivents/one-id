import { isAxiosError } from 'axios';

import { AppError } from './app-error';

export class ErrorMapper {
  /**
   * Converte qualquer erro desconhecido em uma string legível.
   * @param err O erro que será mapeado.
   * @returns Mensagem de erro amigável
   */
  static toMessage(err: unknown): string {
    // 1. Erros customizados da aplicação
    if (err instanceof AppError) return err.message;

    // 2. Erros nativos JS / TS
    if (err instanceof Error) return err.message;

    // 3. Axios errors
    if (isAxiosError(err)) {
      if (err.response) {
        const status = err.response.status;
        const statusText = err.response.statusText || '';
        const message = err.response.data?.message || err.message || '';
        return message ? `${status} ${statusText}: ${message}` : `${status} ${statusText}`;
      }
      if (err.request) {
        return 'No response received from server.';
      }
      return err.message;
    }

    // 4. Outros objetos genéricos com mensagem
    if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if ('status' in e && 'statusText' in e) {
        return `${e.status} ${e.statusText}`;
      }
    }

    // 5. Fallback seguro
    return 'An unknown error occurred.';
  }
}
