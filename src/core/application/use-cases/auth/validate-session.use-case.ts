import type { UserTokenPayload } from '@/core/domain/contracts';
import { ITokenProvider } from '@/core/domain/contracts';

export class ValidateSessionUseCase {
  constructor(private readonly tokenProvider: ITokenProvider) {}

  async execute(token: string): Promise<UserTokenPayload> {
    const payload = await this.tokenProvider.verifyUserToken(token);
    return payload;
  }
}
