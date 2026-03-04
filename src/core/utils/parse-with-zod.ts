import { ZodType } from 'zod/v4';

import { ZodValidationError } from '../errors';

export const parseWithZod = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) throw new ZodValidationError(result.error);
  return result.data;
};
