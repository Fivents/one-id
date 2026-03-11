'use client';

import { useState } from 'react';

import { Monitor } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTotem } from '@/core/application/contexts/totem-context';
import { useI18n } from '@/i18n';

export default function TotemPage() {
  const { t } = useI18n();
  const { isAuthenticated, totem, authenticateTotem, logoutTotem } = useTotem();
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!accessCode.trim()) return;

    setIsLoading(true);
    try {
      await authenticateTotem({ accessCode });
      toast.success(t('totem.loginSuccess'));
    } catch {
      toast.error(t('totem.loginError'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthenticated && totem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <Monitor className="text-primary h-10 w-10" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">{totem.name}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t('totem.credentialingPlaceholder')}</p>
        </div>
        <div className="bg-muted/50 max-w-md rounded-lg border p-6 text-center">
          <p className="text-muted-foreground text-sm">{t('totem.credentialingComingSoon')}</p>
        </div>
        <Button variant="outline" onClick={logoutTotem}>
          {t('totem.logout')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
        <Monitor className="text-primary h-10 w-10" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('totem.loginTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('totem.loginDescription')}</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <Input
          type="text"
          placeholder={t('totem.accessCodePlaceholder')}
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin();
          }}
        />
        <Button className="w-full" onClick={handleLogin} disabled={isLoading || !accessCode.trim()}>
          {isLoading ? t('common.actions.loading') : t('totem.loginButton')}
        </Button>
      </div>
    </div>
  );
}
