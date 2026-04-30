export interface ControllerResponse<T = unknown> {
  statusCode: number;
  body: T | { error: string };
}

export function ok<T>(body: T): ControllerResponse<T> {
  return { statusCode: 200, body };
}

export function created<T>(body: T): ControllerResponse<T> {
  return { statusCode: 201, body };
}

export function noContent(): ControllerResponse<null> {
  return { statusCode: 204, body: null as never };
}

export function badRequest(message: string): ControllerResponse<never> {
  return { statusCode: 400, body: { error: message } };
}

export function unauthorized(message: string): ControllerResponse<never> {
  return { statusCode: 401, body: { error: message } };
}

export function forbidden(message: string): ControllerResponse<never> {
  return { statusCode: 403, body: { error: message } };
}

export function notFound(message: string): ControllerResponse<never> {
  return { statusCode: 404, body: { error: message } };
}

export function conflict(message: string): ControllerResponse<never> {
  return { statusCode: 409, body: { error: message } };
}

export function serverError(message = 'Internal server error.'): ControllerResponse<never> {
  return { statusCode: 500, body: { error: message } };
}
