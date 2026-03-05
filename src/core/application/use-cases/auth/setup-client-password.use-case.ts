import { IAuthIdentityRepository, IPasswordHasher, ITokenProvider } from '@/core/domain/contracts';
import { InvalidSetupTokenError } from '@/core/errors';

export class SetupClientPasswordUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(setupToken: string, password: string): Promise<void> {
    const payload = await this.tokenProvider.verifySetupToken(setupToken);

    if (payload.purpose !== 'password-setup') {
      throw new InvalidSetupTokenError();
    }

    const userId = payload.sub;

    const existingIdentity = await this.authIdentityRepository.findByUserIdAndProvider(userId, 'credentials');

    const passwordHash = await this.passwordHasher.hash(password);

    if (existingIdentity) {
      await this.authIdentityRepository.updatePasswordHash(existingIdentity.id, passwordHash);
    } else {
      await this.authIdentityRepository.create({
        provider: 'credentials',
        providerId: userId,
        passwordHash,
        userId,
      });
    }
  }
}
