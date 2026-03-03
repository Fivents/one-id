import { NextRequest, NextResponse } from 'next/server';

import { LoginRequest, LoginResquestBody } from '@/features/auth/communication/request/login.request';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginResquestBody;
}
