'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Mail,
  Settings,
  RefreshCw,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Types ────────────────────────────────────────────────────────────

type ConnectionStatus = 'configured' | 'global' | 'not_configured';

interface EmailSettings {
  id: string;
  fromName: string;
  fromEmail: string | null;
  replyTo: string | null;
  hasApiKey: boolean;
  updatedAt: string;
}

interface EmailSettingsResponse {
  settings: EmailSettings | null;
  status: ConnectionStatus;
  globalFromEmail: string | null;
  globalFromName: string | null;
}

interface EmailLog {
  id: string;
  eventId: string | null;
  participantId: string | null;
  recipient: string;
  template: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  providerMsgId: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

// ── Sub-components ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === 'configured') {
    return (
      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
        <CheckCircle className="size-3.5" />
        Configurado (chave da organização)
      </Badge>
    );
  }
  if (status === 'global') {
    return (
      <Badge className="gap-1.5 bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/20">
        <CheckCircle className="size-3.5" />
        Configurado (chave global)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <AlertCircle className="size-3.5" />
      Não configurado
    </Badge>
  );
}

function LogStatusBadge({ status }: { status: EmailLog['status'] }) {
  if (status === 'SENT') {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
        <CheckCircle className="size-3" />
        Enviado
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge className="gap-1 bg-red-500/15 text-red-600 border-red-500/30 text-xs">
        <XCircle className="size-3" />
        Falhou
      </Badge>
    );
  }
  if (status === 'SKIPPED') {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground text-xs">
        <AlertCircle className="size-3" />
        Ignorado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Clock className="size-3" />
      Pendente
    </Badge>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function EmailSettingsPage() {

  // Data state
  const [settingsData, setSettingsData] = useState<EmailSettingsResponse | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Action state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // ── Fetch settings ──────────────────────────────────────────────

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/email-settings`);
      if (!res.ok) throw new Error('Falha ao carregar configurações');
      const data: EmailSettingsResponse = await res.json();
      setSettingsData(data);

      // Populate form from existing settings
      if (data.settings) {
        setFromName(data.settings.fromName ?? '');
        setFromEmail(data.settings.fromEmail ?? '');
        setReplyTo(data.settings.replyTo ?? '');
      } else {
        setFromName(data.globalFromName ?? 'OneID');
        setFromEmail(data.globalFromEmail ?? '');
      }
    } catch (err) {
      toast.error('Erro ao carregar configurações de email');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setIsLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/email-settings/logs?page=${page}&pageSize=10`);
      if (!res.ok) throw new Error('Falha ao carregar logs');
      const data = await res.json();
      setLogs(data.items);
      setLogsTotal(data.total);
      setLogsPage(page);
    } catch {
      toast.error('Erro ao carregar histórico de envios');
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  // ── Actions ─────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: Record<string, string> = { fromName, fromEmail, replyTo };
      if (apiKey) body.apiKey = apiKey;

      const res = await fetch(`/api/admin/email-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Erro ao salvar');
      }

      toast.success('Configurações de email salvas com sucesso');
      setApiKey(''); // Clear sensitive input after save
      await fetchSettings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(`/api/admin/email-settings/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao enviar email de teste');
      }

      toast.success(`Email de teste enviado para ${data.sentTo}`);
      await fetchLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar email de teste');
    } finally {
      setIsTesting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/dashboard`}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="size-6" />
              Configurações de Email
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure o envio de códigos de acesso por email para os participantes dos seus eventos.
            </p>
          </div>
          <StatusBadge status={settingsData?.status ?? 'not_configured'} />
        </div>
      </div>

      {/* ── Settings Card ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" />
            Provedor de Email — Resend
          </CardTitle>
          <CardDescription>
            Integração com{' '}
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Resend
            </a>{' '}
            para envio de emails transacionais. A chave configurada aqui tem prioridade sobre a variável de ambiente global.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="email-api-key">
              Chave de API do Resend
              {settingsData?.settings?.hasApiKey && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (chave salva — deixe em branco para manter)
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="email-api-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder={
                  settingsData?.settings?.hasApiKey
                    ? '••••••••••••••••••••••••••••••'
                    : settingsData?.status === 'global'
                      ? 'Usando chave global do ambiente'
                      : 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Crie em{' '}
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                resend.com/api-keys
              </a>
            </p>
          </div>

          <Separator />

          {/* From Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-from-name">Nome do remetente</Label>
              <Input
                id="email-from-name"
                placeholder="OneID"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>

            {/* From Email */}
            <div className="space-y-2">
              <Label htmlFor="email-from-email">
                Email remetente
                <span className="ml-1 text-xs text-muted-foreground font-normal">(domínio verificado no Resend)</span>
              </Label>
              <Input
                id="email-from-email"
                type="email"
                placeholder={settingsData?.globalFromEmail ?? 'oneid@seudominio.com'}
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Reply To */}
          <div className="space-y-2">
            <Label htmlFor="email-reply-to">
              Reply-To <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <Input
              id="email-reply-to"
              type="email"
              placeholder="suporte@seudominio.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={isSaving} id="save-email-settings">
              {isSaving ? <RefreshCw className="size-4 mr-2 animate-spin" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar configurações'}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={isTesting || settingsData?.status === 'not_configured'}
              id="test-email-button"
            >
              {isTesting ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
              {isTesting ? 'Enviando...' : 'Enviar email de teste'}
            </Button>

            {settingsData?.status === 'not_configured' && (
              <p className="text-xs text-muted-foreground">Configure uma chave API antes de testar</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Email Log ── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base">Histórico de Envios</CardTitle>
            <CardDescription className="mt-0.5">Últimos {logs.length} de {logsTotal} envios</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLogs(1)}
            disabled={isLogsLoading}
            id="refresh-email-logs"
          >
            <RefreshCw className={`size-4 ${isLogsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLogsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center">
              <Mail className="size-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhum email enviado ainda</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs max-w-[180px] truncate">
                        {log.recipient}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.template}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <LogStatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.error ?? log.providerMsgId ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {logsTotal > 10 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage <= 1}
                    onClick={() => fetchLogs(logsPage - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {logsPage} de {Math.ceil(logsTotal / 10)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage >= Math.ceil(logsTotal / 10)}
                    onClick={() => fetchLogs(logsPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
