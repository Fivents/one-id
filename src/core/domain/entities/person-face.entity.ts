import { BaseEntity } from './base.entity';

export interface PersonFaceProps {
  id: string;
  embedding: Buffer;
  imageHash: string;
  imageUrl: string;
  personId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PersonFaceEntity extends BaseEntity {
  private constructor(private readonly props: PersonFaceProps) {
    super(props.id);
  }

  static create(props: PersonFaceProps): PersonFaceEntity {
    return new PersonFaceEntity(props);
  }

  get embedding(): Buffer {
    return this.props.embedding;
  }

  get imageHash(): string {
    return this.props.imageHash;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get personId(): string {
    return this.props.personId;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  isUsable(): boolean {
    return this.props.isActive && !this.isDeleted();
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  belongsToPerson(personId: string): boolean {
    return this.props.personId === personId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      imageHash: this.props.imageHash,
      imageUrl: this.props.imageUrl,
      personId: this.props.personId,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
