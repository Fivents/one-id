import { IUserRepository } from '@/core/domain/contracts';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new DeleteUserError('User not found.');
    }

    await this.userRepository.softDelete(id);
  }
}

export class DeleteUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteUserError';
  }
}
