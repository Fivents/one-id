'use client';

import { Suspense } from 'react';

import { SetPasswordForm } from '@/features/auth/components/set-password-form';

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
