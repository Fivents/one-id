export abstract class BaseEntity {
  protected constructor(private readonly _id: string) {
    if (!_id) {
      throw new Error('Entity id is required');
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
