'use client';

import { useCallback, useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { eventsClient, organizationPeopleSettingsClient } from '@/core/application/client-services';
import type { CodeSourceFieldOption } from '@/core/communication/requests/organization-people-settings';

interface EventPeopleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  organizationId: string;
  accessCodeSource: CodeSourceFieldOption | null;
  qrCodeSource: CodeSourceFieldOption | null;
  onSaved: (settings: { accessCodeSource: CodeSourceFieldOption | null; qrCodeSource: CodeSourceFieldOption | null }) => void;
}

const CODE_SOURCE_LABELS: Record<CodeSourceFieldOption, string> = {
  NONE: 'Desativado (aleatório)',
  DOCUMENT: 'Documento',
  PHONE: 'Telefone',
  EMAIL: 'E-mail',
};

const CODE_SOURCE_OPTIONS = Object.keys(CODE_SOURCE_LABELS) as CodeSourceFieldOption[];

const INHERIT_VALUE = '__INHERIT__';

export function EventPeopleSettingsDialog({
  open,
  onOpenChange,
  eventId,
  organizationId,
  accessCodeSource,
  qrCodeSource,
  onSaved,
}: EventPeopleSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [orgAccessCodeSource, setOrgAccessCodeSource] = useState<CodeSourceFieldOption>('NONE');
  const [orgQrCodeSource, setOrgQrCodeSource] = useState<CodeSourceFieldOption>('NONE');

  const [accessCodeValue, setAccessCodeValue] = useState<string>(accessCodeSource ?? INHERIT_VALUE);
  const [qrCodeValue, setQrCodeValue] = useState<string>(qrCodeSource ?? INHERIT_VALUE);

  useEffect(() => {
    if (!open) return;

    setAccessCodeValue(accessCodeSource ?? INHERIT_VALUE);
    setQrCodeValue(qrCodeSource ?? INHERIT_VALUE);

    setIsLoading(true);
    organizationPeopleSettingsClient
      .getSettings(organizationId)
      .then((response) => {
        if (response.success) {
          setOrgAccessCodeSource(response.data.accessCodeSource);
          setOrgQrCodeSource(response.data.qrCodeSource);
        }
      })
      .finally(() => setIsLoading(false));
  }, [open, organizationId, accessCodeSource, qrCodeSource]);

  const hasChanges = accessCodeValue !== (accessCodeSource ?? INHERIT_VALUE) || qrCodeValue !== (qrCodeSource ?? INHERIT_VALUE);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const nextAccessCodeSource = accessCodeValue === INHERIT_VALUE ? null : (accessCodeValue as CodeSourceFieldOption);
      const nextQrCodeSource = qrCodeValue === INHERIT_VALUE ? null : (qrCodeValue as CodeSourceFieldOption);

      const response = await eventsClient.updateEvent(eventId, {
        accessCodeSource: nextAccessCodeSource,
        qrCodeSource: nextQrCodeSource,
      });

      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Configurações do evento salvas.');
      onSaved({ accessCodeSource: nextAccessCodeSource, qrCodeSource: nextQrCodeSource });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [accessCodeValue, qrCodeValue, eventId, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurações de Pessoas do Evento</DialogTitle>
          <DialogDescription>
            Por padrão, este evento usa a mesma origem de código configurada na organização. Escolha um valor aqui
            apenas se este evento precisar de uma regra diferente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Código de acesso</Label>
            <Select value={accessCodeValue} onValueChange={setAccessCodeValue} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERIT_VALUE}>
                  Herdar da organização ({CODE_SOURCE_LABELS[orgAccessCodeSource]})
                </SelectItem>
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
            <Select value={qrCodeValue} onValueChange={setQrCodeValue} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERIT_VALUE}>
                  Herdar da organização ({CODE_SOURCE_LABELS[orgQrCodeSource]})
                </SelectItem>
                {CODE_SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CODE_SOURCE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
