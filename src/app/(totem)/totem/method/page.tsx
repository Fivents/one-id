'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Camera, ChevronRight, KeyRound, QrCode, ShieldCheck } from 'lucide-react';

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

  function _handleLogout() {
    clearTotemToken();
    router.replace('/totem');
  }

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
          <div className="relative h-12 w-12 rounded-full bg-slate-800 ring-2 ring-slate-700" />
        </div>
        <p className="text-sm text-slate-400">Carregando sessão do totem...</p>
      </div>
    );
  }

  const methods = [
    {
      href: '/totem/face',
      enabled: session.activeEvent.faceEnabled,
      icon: Camera,
      title: 'Reconhecimento Facial',
      description: 'Check-in automático por IA',
      gradient: 'from-violet-600 to-purple-700',
      glowColor: 'violet',
    },
    {
      href: '/totem/qr',
      enabled: session.activeEvent.qrEnabled,
      icon: QrCode,
      title: 'QR Code',
      description: 'Escaneie seu código',
      gradient: 'from-cyan-600 to-blue-700',
      glowColor: 'cyan',
    },
    {
      href: '/totem/code',
      enabled: session.activeEvent.codeEnabled,
      icon: KeyRound,
      title: 'Código de Acesso',
      description: 'Digite seu código',
      gradient: 'from-emerald-600 to-teal-700',
      glowColor: 'emerald',
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      {/* Main content */}
      <div className="mt-8 flex flex-1 flex-col items-center justify-center px-4">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white">Como deseja fazer check-in?</h2>
          <p className="mt-2 text-slate-400">Selecione uma das opções disponíveis</p>
        </div>

        {/* Method cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {methods.map((method) => {
            const Icon = method.icon;
            const isDisabled = !method.enabled;

            if (isDisabled) {
              return (
                <div
                  key={method.href}
                  className="relative cursor-not-allowed rounded-2xl bg-slate-800/30 p-6 opacity-40"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/50">
                      <Icon className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-400">{method.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{method.description}</p>
                    <span className="mt-3 rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-500">
                      Não disponível
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link key={method.href} href={method.href} className="group relative block">
                {/* Glow effect */}
                <div
                  className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${method.gradient} opacity-0 blur transition-opacity duration-300 group-hover:opacity-30`}
                />

                {/* Border gradient */}
                <div
                  className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${method.gradient} opacity-50 transition-opacity duration-300 group-hover:opacity-100`}
                />

                {/* Card content */}
                <div className="relative flex h-full flex-col items-center rounded-2xl bg-slate-900/95 p-6 text-center transition-transform duration-200 group-active:scale-[0.98]">
                  {/* Icon container */}
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${method.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-10 w-10 text-white" />
                  </div>

                  {/* Text */}
                  <h3 className="mt-5 text-lg font-bold text-white">{method.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{method.description}</p>

                  {/* Arrow indicator */}
                  <div className="text-primary mt-4 flex items-center gap-1 text-sm font-medium opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    Iniciar
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500/70" />
          <span>Check-in validado por evento ativo e sessão segura</span>
        </div>
      </footer>
    </div>
  );
}
