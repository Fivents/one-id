import type { UserEntity, UserWithMembership } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailWithMembership(email: string): Promise<UserWithMembership | null>;
  create(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity>;
}
