'use client';

import { useCallback, useEffect, useState } from 'react';

import { Link2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type AutoLinkEventResponse,
  eventsClient,
  organizationPeopleSettingsClient,
  type RecalculateTarget,
} from '@/core/application/client-services';
import type { CodeSourceFieldOption } from '@/core/communication/requests/organization-people-settings';

interface PeopleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const CODE_SOURCE_LABELS: Record<CodeSourceFieldOption, string> = {
  NONE: 'Desativado (aleatório)',
  DOCUMENT: 'Documento',
  PHONE: 'Telefone',
  EMAIL: 'E-mail',
};

const CODE_SOURCE_OPTIONS = Object.keys(CODE_SOURCE_LABELS) as CodeSourceFieldOption[];

export function PeopleSettingsDialog({ open, onOpenChange, organizationId }: PeopleSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [events, setEvents] = useState<AutoLinkEventResponse[]>([]);
  const [backfillPreview, setBackfillPreview] = useState<Record<string, number>>({});
  const [backfillingEventId, setBackfillingEventId] = useState<string | null>(null);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);

  const [accessCodeSource, setAccessCodeSource] = useState<CodeSourceFieldOption>('NONE');
  const [qrCodeSource, setQrCodeSource] = useState<CodeSourceFieldOption>('NONE');
  const [savedAccessCodeSource, setSavedAccessCodeSource] = useState<CodeSourceFieldOption>('NONE');
  const [savedQrCodeSource, setSavedQrCodeSource] = useState<CodeSourceFieldOption>('NONE');
  const [isSavingCodeSettings, setIsSavingCodeSettings] = useState(false);
  const [recalculatePreview, setRecalculatePreview] = useState<{ target: RecalculateTarget; count: number } | null>(
    null,
  );
  const [isRecalculating, setIsRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, eventsRes] = await Promise.all([
        organizationPeopleSettingsClient.getSettings(organizationId),
        organizationPeopleSettingsClient.listAutoLinkEvents(organizationId),
      ]);

      if (settingsRes.success) {
        setAccessCodeSource(settingsRes.data.accessCodeSource);
        setQrCodeSource(settingsRes.data.qrCodeSource);
        setSavedAccessCodeSource(settingsRes.data.accessCodeSource);
        setSavedQrCodeSource(settingsRes.data.qrCodeSource);
      } else {
        toast.error(settingsRes.error.message);
      }

      if (eventsRes.success) {
        setEvents(eventsRes.data);
      } else {
        toast.error(eventsRes.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open) {
      void loadData();
      setRecalculatePreview(null);
      setBackfillPreview({});
    }
  }, [open, loadData]);

  const handleToggleAutoLink = useCallback(async (event: AutoLinkEventResponse, nextValue: boolean) => {
    setTogglingEventId(event.id);
    try {
      const response = await eventsClient.updateEvent(event.id, { autoLinkNewPeople: nextValue });
      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, autoLinkNewPeople: nextValue } : e)));

      if (nextValue) {
        const preview = await organizationPeopleSettingsClient.previewEventBackfill(event.id);
        if (preview.success) {
          setBackfillPreview((prev) => ({ ...prev, [event.id]: preview.data.eligibleCount }));
        }
      } else {
        setBackfillPreview((prev) => {
          const next = { ...prev };
          delete next[event.id];
          return next;
        });
      }
    } finally {
      setTogglingEventId(null);
    }
  }, []);

  const handleConfirmBackfill = useCallback(async (eventId: string) => {
    setBackfillingEventId(eventId);
    try {
      let cursor: string | undefined;
      let totalLinked = 0;
      let remaining = true;

      while (remaining) {
        const response = await organizationPeopleSettingsClient.confirmEventBackfill(eventId, cursor);
        if (!response.success) {
          toast.error(response.error.message);
          break;
        }
        totalLinked += response.data.processedCount;
        remaining = response.data.remaining;
        cursor = response.data.nextCursor ?? undefined;
      }

      toast.success(`${totalLinked} pessoas vinculadas ao evento.`);
      setBackfillPreview((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    } finally {
      setBackfillingEventId(null);
    }
  }, []);

  const codeSettingsChanged = accessCodeSource !== savedAccessCodeSource || qrCodeSource !== savedQrCodeSource;

  const handleSaveCodeSettings = useCallback(async () => {
    setIsSavingCodeSettings(true);
    try {
      const response = await organizationPeopleSettingsClient.updateSettings(organizationId, {
        accessCodeSource,
        qrCodeSource,
      });

      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      const accessChanged = accessCodeSource !== savedAccessCodeSource;
      const qrChanged = qrCodeSource !== savedQrCodeSource;
      setSavedAccessCodeSource(accessCodeSource);
      setSavedQrCodeSource(qrCodeSource);
      toast.success('Configurações salvas.');

      const changedTarget: RecalculateTarget | null = accessChanged ? 'accessCode' : qrChanged ? 'qrCode' : null;
      if (changedTarget) {
        const preview = await organizationPeopleSettingsClient.previewRecalculate(organizationId, changedTarget);
        if (preview.success && preview.data.eligibleCount > 0) {
          setRecalculatePreview({ target: changedTarget, count: preview.data.eligibleCount });
        }
      }
    } finally {
      setIsSavingCodeSettings(false);
    }
  }, [organizationId, accessCodeSource, qrCodeSource, savedAccessCodeSource, savedQrCodeSource]);

  const handleConfirmRecalculate = useCallback(async () => {
    if (!recalculatePreview) return;
    setIsRecalculating(true);
    try {
      let cursor: string | undefined;
      let totalUpdated = 0;
      let remaining = true;

      while (remaining) {
        const response = await organizationPeopleSettingsClient.confirmRecalculate(
          organizationId,
          recalculatePreview.target,
          cursor,
        );
        if (!response.success) {
          toast.error(response.error.message);
          break;
        }
        totalUpdated += response.data.updatedCount;
        remaining = response.data.remaining;
        cursor = response.data.nextCursor ?? undefined;
      }

      toast.success(`${totalUpdated} pessoas recalculadas.`);
      setRecalculatePreview(null);
    } finally {
      setIsRecalculating(false);
    }
  }, [organizationId, recalculatePreview]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações de Pessoas</DialogTitle>
          <DialogDescription>
            Vínculo automático a eventos e geração de código de acesso/QR a partir dos dados da pessoa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="auto-link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto-link">Vínculo automático</TabsTrigger>
            <TabsTrigger value="codes">Código de acesso / QR</TabsTrigger>
          </TabsList>

          <TabsContent value="auto-link" className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              Ative para vincular automaticamente toda nova pessoa da organização a este evento.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">Nenhum evento cadastrado.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{event.name}</p>
                        <Badge variant="outline" className="mt-1">
                          {event.status}
                        </Badge>
                      </div>
                      <Switch
                        checked={event.autoLinkNewPeople}
                        disabled={togglingEventId === event.id}
                        onCheckedChange={(checked) => handleToggleAutoLink(event, checked)}
                      />
                    </div>

                    {(backfillPreview[event.id] ?? 0) > 0 && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-amber-500/10 p-2">
                        <p className="text-xs">
                          {backfillPreview[event.id]} pessoas ainda não vinculadas a este evento.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={backfillingEventId === event.id}
                          onClick={() => handleConfirmBackfill(event.id)}
                        >
                          {backfillingEventId === event.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          Confirmar vinculação
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="codes" className="space-y-4 py-2">
            <p className="text-muted-foreground text-sm">
              Define de onde vem o código de acesso e o valor do QR-code gerados automaticamente para novas pessoas.
              Um valor digitado manualmente sempre tem prioridade.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Código de acesso</Label>
                <Select
                  value={accessCodeSource}
                  onValueChange={(value) => setAccessCodeSource(value as CodeSourceFieldOption)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {CODE_SOURCE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>QR-code</Label>
                <Select value={qrCodeSource} onValueChange={(value) => setQrCodeSource(value as CodeSourceFieldOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {CODE_SOURCE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSaveCodeSettings} disabled={!codeSettingsChanged || isSavingCodeSettings}>
              {isSavingCodeSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>

            {recalculatePreview && recalculatePreview.count > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-md bg-amber-500/10 p-3">
                <p className="text-sm">
                  {recalculatePreview.count} pessoas terão o{' '}
                  {recalculatePreview.target === 'accessCode' ? 'código de acesso' : 'QR-code'} recalculado.
                </p>
                <Button size="sm" variant="outline" disabled={isRecalculating} onClick={handleConfirmRecalculate}>
                  {isRecalculating ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <QrCode className="mr-1 h-3.5 w-3.5" />
                  )}
                  Confirmar recálculo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
