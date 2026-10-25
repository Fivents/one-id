'use client';

import { useCallback, useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { orgTotemsClient } from '@/core/application/client-services';
import { useI18n } from '@/i18n';

interface GatePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  subscriptionId: string;
  locationName: string;
  initialSectors: string[];
  initialTicketTypes: string[];
  onSaved: () => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function GatePolicyDialog({
  open,
  onOpenChange,
  eventId,
  subscriptionId,
  locationName,
  initialSectors,
  initialTicketTypes,
  onSaved,
}: GatePolicyDialogProps) {
  const { t } = useI18n();

  const [sectors, setSectors] = useState<string[]>([]);
  const [ticketTypes, setTicketTypes] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(initialSectors);
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<string[]>(initialTicketTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset to what the server has whenever the dialog is reopened, so a cancelled edit does not
  // linger into the next one.
  const dialogKey = `${open}:${subscriptionId}`;
  const [lastDialogKey, setLastDialogKey] = useState(dialogKey);

  if (dialogKey !== lastDialogKey) {
    setLastDialogKey(dialogKey);
    if (open) {
      setSelectedSectors(initialSectors);
      setSelectedTicketTypes(initialTicketTypes);
    }
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      const response = await orgTotemsClient.getEventGateCatalog(eventId);
      if (cancelled) return;

      if (!response.success) {
        toast.error(response.error.message || t('integrations.sympla.gate.loadError'));
        setIsLoading(false);
        return;
      }

      setSectors(response.data?.sectors ?? []);
      setTicketTypes(response.data?.ticketTypes ?? []);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, eventId, t]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    const response = await orgTotemsClient.updateGatePolicy(eventId, subscriptionId, {
      allowedSectors: selectedSectors,
      allowedTicketTypes: selectedTicketTypes,
    });

    setIsSaving(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(t('integrations.sympla.gate.saved'));
    onOpenChange(false);
    onSaved();
  }, [eventId, subscriptionId, selectedSectors, selectedTicketTypes, t, onOpenChange, onSaved]);

  const isUnrestricted = selectedSectors.length === 0 && selectedTicketTypes.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('integrations.sympla.gate.title')}</DialogTitle>
          <DialogDescription>
            {locationName} — {t('integrations.sympla.gate.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{t('integrations.sympla.gate.sectors')}</Label>
              {sectors.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('integrations.sympla.gate.noSectors')}</p>
              ) : (
                <div className="space-y-2 rounded-lg border p-3">
                  {sectors.map((sector) => (
                    <label key={sector} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedSectors.includes(sector)}
                        onCheckedChange={() => setSelectedSectors((current) => toggle(current, sector))}
                      />
                      <span>{sector}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('integrations.sympla.gate.ticketTypes')}</Label>
              {ticketTypes.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('integrations.sympla.gate.noTicketTypes')}</p>
              ) : (
                <div className="space-y-2 rounded-lg border p-3">
                  {ticketTypes.map((ticketType) => (
                    <label key={ticketType} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedTicketTypes.includes(ticketType)}
                        onCheckedChange={() => setSelectedTicketTypes((current) => toggle(current, ticketType))}
                      />
                      <span>{ticketType}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isUnrestricted ? (
                <Badge variant="secondary">{t('integrations.sympla.gate.unrestricted')}</Badge>
              ) : (
                <Badge>{t('integrations.sympla.gate.restrictedTo')}: {selectedSectors.length + selectedTicketTypes.length}</Badge>
              )}
              <p className="text-muted-foreground text-xs">{t('integrations.sympla.gate.hint')}</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!isUnrestricted && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedSectors([]);
                setSelectedTicketTypes([]);
              }}
            >
              {t('integrations.sympla.gate.clearAll')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? t('integrations.sympla.gate.saving') : t('integrations.sympla.gate.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
