import { BaseEntity } from './base.entity';

export interface PlanProps {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PlanEntity extends BaseEntity {
  private constructor(private readonly props: PlanProps) {
    super(props.id);
  }

  static create(props: PlanProps): PlanEntity {
    if (props.price < 0) {
      throw new Error('Plan price cannot be negative');
    }
    if (props.discount < 0) {
      throw new Error('Plan discount cannot be negative');
    }
    return new PlanEntity(props);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get discount(): number {
    return this.props.discount;
  }

  get isCustom(): boolean {
    return this.props.isCustom;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
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

  effectivePrice(): number {
    return Math.max(0, this.props.price - this.props.discount);
  }

  isFree(): boolean {
    return this.effectivePrice() <= 0;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  isAvailable(): boolean {
    return this.props.isActive && !this.isDeleted();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      description: this.props.description,
      price: this.props.price,
      discount: this.props.discount,
      isCustom: this.props.isCustom,
      isActive: this.props.isActive,
      sortOrder: this.props.sortOrder,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
