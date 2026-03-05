import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }
}
