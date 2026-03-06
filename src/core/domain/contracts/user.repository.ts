import type { UserEntity, UserWithMembership } from '../entities/user.entity';
import { Role } from '../value-objects/role';

export interface UserWithOrganization {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  role: Role | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByIdIncludingDeleted(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailIncludingDeleted(email: string): Promise<UserEntity | null>;
  findByEmailWithMembership(email: string): Promise<UserWithMembership | null>;
  findAll(): Promise<UserEntity[]>;
  findAllWithOrganization(): Promise<UserWithOrganization[]>;
  findAllDeletedWithOrganization(): Promise<UserWithOrganization[]>;
  create(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity>;
  update(id: string, data: { name?: string; email?: string; avatarUrl?: string }): Promise<UserEntity>;
  restore(id: string, data: { name: string }): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
  softDeleteMany(ids: string[]): Promise<void>;
  hardDelete(id: string): Promise<void>;
  hardDeleteMany(ids: string[]): Promise<void>;
  findOrCreateFiventsOrganization(): Promise<{ id: string }>;
  createMembership(data: { userId: string; organizationId: string; role: Role }): Promise<void>;
}
