'use client';

import { useState } from 'react';

import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminUsers } from '@/core/application/contexts';
import type { AdminUserResponse } from '@/core/communication/responses/admin';

interface ResetPasswordModalProps {
  user: AdminUserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordModal({ user, open, onOpenChange }: ResetPasswordModalProps) {
  const { resetPassword } = useAdminUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  async function handleReset() {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const password = await resetPassword(user.id);
      setTemporaryPassword(password);
      toast.success('Password reset successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setTemporaryPassword(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Reset Password</DialogTitle>
          <DialogDescription className="text-center">
            {temporaryPassword
              ? 'A new temporary password has been generated.'
              : `Generate a new temporary password for ${user?.name ?? 'this user'}.`}
          </DialogDescription>
        </DialogHeader>

        {temporaryPassword ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input value={temporaryPassword} readOnly className="font-mono" />
            </div>
            <p className="text-muted-foreground text-xs">
              Share this password securely. The user will be asked to set a new password on first login.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          {temporaryPassword ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleReset} disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
