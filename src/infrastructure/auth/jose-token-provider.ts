import * as jose from 'jose';

import type {
  ITokenProvider,
  SetupTokenPayload,
  TotemTokenPayload,
  UserTokenPayload,
} from '@/domain/auth/contracts/token-provider';

export class JoseTokenProvider implements ITokenProvider {
  private readonly secret: Uint8Array;
  private readonly issuer = 'oneid';

  constructor(jwtSecret: string) {
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async signUserToken(payload: UserTokenPayload): Promise<string> {
    return new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience('user')
      .setExpirationTime('24h')
      .sign(this.secret);
  }

  async signTotemToken(payload: TotemTokenPayload): Promise<string> {
    return new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience('totem')
      .setExpirationTime('30d')
      .sign(this.secret);
  }

  async signSetupToken(payload: SetupTokenPayload): Promise<string> {
    return new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience('setup')
      .setExpirationTime('1h')
      .sign(this.secret);
  }

  async verifyUserToken(token: string): Promise<UserTokenPayload> {
    const { payload } = await jose.jwtVerify(token, this.secret, {
      issuer: this.issuer,
      audience: 'user',
    });
    return payload as unknown as UserTokenPayload;
  }

  async verifyTotemToken(token: string): Promise<TotemTokenPayload> {
    const { payload } = await jose.jwtVerify(token, this.secret, {
      issuer: this.issuer,
      audience: 'totem',
    });
    return payload as unknown as TotemTokenPayload;
  }

  async verifySetupToken(token: string): Promise<SetupTokenPayload> {
    const { payload } = await jose.jwtVerify(token, this.secret, {
      issuer: this.issuer,
      audience: 'setup',
    });
    return payload as unknown as SetupTokenPayload;
  }
}
