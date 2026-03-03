import { ErrorMapper } from '@/lib/errors';
import api from '@/lib/http/axios-instance';
import { ServiceResult } from '@/lib/types/service-result';

import { LoginRequest } from '../communication/request/login.request';

export async function login(req: LoginRequest): Promise<ServiceResult> {
  try {
    await api.post('/login', req);
    return { success: true };
  } catch (err) {
    return { success: false, error: ErrorMapper.toMessage(err) };
  }
}
