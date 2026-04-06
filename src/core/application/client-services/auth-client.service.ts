import type {
  CheckEmailRequest,
  LoginAccessCodeRequest,
  LoginEmailRequest,
  SetupPasswordRequest,
} from '@/core/communication/requests/auth';
import type {
  AuthTokenResponse,
  AuthUserResponse,
  CheckEmailResponse,
  TotemAuthResponse,
} from '@/core/communication/responses/auth';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class AuthClientService extends BaseClient {
  async loginWithEmail(data: LoginEmailRequest): Promise<ApiResponse<{ user: AuthUserResponse }>> {
    return this.post('/auth/login', data);
  }

  async checkEmail(data: CheckEmailRequest): Promise<ApiResponse<CheckEmailResponse>> {
    return this.post('/auth/check-email', data);
  }

  async setupPassword(data: SetupPasswordRequest): Promise<ApiResponse<{ user: AuthUserResponse }>> {
    return this.post('/auth/setup-password', data);
  }

  async loginWithGoogle(): Promise<ApiResponse<void>> {
    return this.get('/auth/google');
  }

  async tokenLogin(data: LoginAccessCodeRequest): Promise<ApiResponse<TotemAuthResponse>> {
    return this.post('/auth/token-login', data);
  }

  async logout(): Promise<ApiResponse<{ success: true }>> {
    return this.post('/auth/logout');
  }

  async refreshSession(): Promise<ApiResponse<AuthTokenResponse>> {
    return this.post('/auth/refresh');
  }
}

export const authClient = new AuthClientService();
