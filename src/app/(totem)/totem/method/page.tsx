'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Camera, KeyRound, LogOut, QrCode, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearTotemToken } from '@/core/application/client-services/totem';

import { useTotemSession } from '../_lib/use-totem-session';

export default function TotemMethodPage() {
  const router = useRouter();
  const { session, isLoading } = useTotemSession();

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }

    const enabledRoutes = [
      session.activeEvent.faceEnabled ? '/totem/face' : null,
      session.activeEvent.qrEnabled ? '/totem/qr' : null,
      session.activeEvent.codeEnabled ? '/totem/code' : null,
    ].filter((value): value is string => Boolean(value));

    if (enabledRoutes.length === 1) {
      router.replace(enabledRoutes[0]);
    }
  }, [isLoading, router, session]);

  function handleLogout() {
    clearTotemToken();
    router.replace('/totem');
  }

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Carregando sessão do totem...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-wide text-cyan-300 uppercase">Totem ativo</p>
            <h1 className="text-xl font-semibold">{session.totem.name}</h1>
            <p className="text-sm text-slate-400">Evento: {session.activeEvent.name}</p>
          </div>
          <Button variant="outline" className="border-slate-700" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-lg">Escolha o método de check-in</CardTitle>
          <CardDescription>Selecione uma opção habilitada para este evento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button
            asChild
            className="h-20 justify-start border border-slate-700 bg-slate-950 text-left text-slate-100 hover:bg-slate-800"
            disabled={!session.activeEvent.faceEnabled}
            variant="ghost"
          >
            <Link href="/totem/face">
              <Camera className="mr-3 h-5 w-5" />
              <span>
                <span className="block text-sm font-medium">Reconhecimento Facial</span>
                <span className="block text-xs text-slate-400">ArcFace local</span>
              </span>
            </Link>
          </Button>

          <Button
            asChild
            className="h-20 justify-start border border-slate-700 bg-slate-950 text-left text-slate-100 hover:bg-slate-800"
            disabled={!session.activeEvent.qrEnabled}
            variant="ghost"
          >
            <Link href="/totem/qr">
              <QrCode className="mr-3 h-5 w-5" />
              <span>
                <span className="block text-sm font-medium">QR Code</span>
                <span className="block text-xs text-slate-400">Leitura por scanner</span>
              </span>
            </Link>
          </Button>

          <Button
            asChild
            className="h-20 justify-start border border-slate-700 bg-slate-950 text-left text-slate-100 hover:bg-slate-800"
            disabled={!session.activeEvent.codeEnabled}
            variant="ghost"
          >
            <Link href="/totem/code">
              <KeyRound className="mr-3 h-5 w-5" />
              <span>
                <span className="block text-sm font-medium">Código de Acesso</span>
                <span className="block text-xs text-slate-400">Entrada manual</span>
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-cyan-300" />
        Check-in validado por evento ativo e sessão do totem.
      </div>
    </div>
  );
}
