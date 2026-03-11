import type { TotemEntity, TotemStatus } from '../entities/totem.entity';

export interface CreateTotemData {
  name: string;
  accessCode?: string | null;
  status: TotemStatus;
  price: number;
  discount: number;
}

export interface UpdateTotemData {
  name?: string;
  accessCode?: string | null;
  status?: TotemStatus;
  price?: number;
  discount?: number;
  lastHeartbeat?: Date;
}

export interface ITotemRepository {
  findByAccessCode(accessCode: string): Promise<TotemEntity | null>;
  findById(id: string): Promise<TotemEntity | null>;
  findByIdIncludeDeleted(id: string): Promise<TotemEntity | null>;
  findAll(): Promise<TotemEntity[]>;
  findAllDeleted(): Promise<TotemEntity[]>;
  create(data: CreateTotemData): Promise<TotemEntity>;
  update(id: string, data: UpdateTotemData): Promise<TotemEntity>;
  softDelete(id: string): Promise<void>;
  softDeleteMany(ids: string[]): Promise<void>;
  restore(id: string): Promise<TotemEntity>;
  hardDelete(id: string): Promise<void>;
  hardDeleteMany(ids: string[]): Promise<void>;
}
