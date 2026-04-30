import { AppError, ErrorCode } from '@/core/errors';

export abstract class BaseEntity {
  protected constructor(private readonly _id: string) {
    if (!_id) {
      throw new AppError({
        code: ErrorCode.ENTITY_INVARIANT_VIOLATION,
        message: 'Entity id is required',
        httpStatus: 500,
        level: 'error',
      });
    }
  }

  get id(): string {
    return this._id;
  }

  equals(other: BaseEntity | null | undefined): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id === other._id;
  }

  abstract toJSON(): Record<string, unknown>;
}
