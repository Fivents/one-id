import { ErrorMapper } from '@/lib/errors';
import api from '@/lib/http/axios-instance';
import { ServiceResult } from '@/lib/types/service-result';

import type { LoginEmailRequest } from '@/application/auth/communication/request/login-email.request';

export async function login(req: LoginEmailRequest): Promise<ServiceResult> {
  try {
    await api.post('/auth/login', req);
    return { success: true };
  } catch (err) {
    return { success: false, error: ErrorMapper.toMessage(err) };
  }
}
