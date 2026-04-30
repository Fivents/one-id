import { BaseEntity } from './base.entity';

export interface FeatureProps {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class FeatureEntity extends BaseEntity {
  private constructor(private readonly props: FeatureProps) {
    super(props.id);
  }

  static create(props: FeatureProps): FeatureEntity {
    return new FeatureEntity(props);
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): string {
    return this.props.type;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  isBooleanType(): boolean {
    return this.props.type === 'boolean';
  }

  isNumberType(): boolean {
    return this.props.type === 'number';
  }

  isStringType(): boolean {
    return this.props.type === 'string';
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  matchesCode(code: string): boolean {
    return this.props.code === code;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.props.code,
      name: this.props.name,
      type: this.props.type,
      description: this.props.description,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
