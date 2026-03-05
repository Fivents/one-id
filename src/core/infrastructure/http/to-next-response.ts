import { NextResponse } from 'next/server';

import type { ControllerResponse } from '@/core/application/controllers/controller-response';

export function toNextResponse<T>(result: ControllerResponse<T>): NextResponse {
  if (result.statusCode === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(result.body, { status: result.statusCode });
}
