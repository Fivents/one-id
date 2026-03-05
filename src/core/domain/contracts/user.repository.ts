import type { UserEntity, UserWithMembership } from '../entities/user.entity';
import { Role } from '../value-objects/role';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailWithMembership(email: string): Promise<UserWithMembership | null>;
  findAll(): Promise<UserEntity[]>;
  create(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity>;
  update(id: string, data: { name?: string; email?: string; avatarUrl?: string }): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
  findOrCreateFiventsOrganization(): Promise<{ id: string }>;
  createMembership(data: { userId: string; organizationId: string; role: Role }): Promise<void>;
}
