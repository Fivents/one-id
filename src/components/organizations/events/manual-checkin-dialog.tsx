'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loader2, Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { eventCheckinsClient, eventsClient } from '@/core/application/client-services';
import type { EventParticipantDetailResponse } from '@/core/application/client-services/events/events-client.service';
import { useI18n } from '@/i18n';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

interface ManualCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onCompleted: () => void | Promise<void>;
}

export function ManualCheckInDialog({ open, onOpenChange, eventId, onCompleted }: ManualCheckInDialogProps) {
  const { t } = useI18n();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EventParticipantDetailResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Names are kept alongside the ids so the selection counter survives paging and searching.
  const [selected, setSelected] = useState<Map<string, string>>(new Map());

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadParticipants = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      // Own fetch, scoped to participants without check-in — independent from the
      // participants tab paging/search state.
      const response = await eventsClient.listEventParticipants(eventId, {
        page,
        pageSize: PAGE_SIZE,
        search,
        checkedIn: false,
      });
      if (requestId !== requestIdRef.current) return;
      if (!response.success) throw new Error(response.error.message);
      setItems(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadParticipantsError');
      toast.error(message);
      setItems([]);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [eventId, page, search, t]);

  useEffect(() => {
    if (!open) return;
    void loadParticipants();
  }, [open, loadParticipants]);

  const allOnPageSelected = useMemo(
    () => items.length > 0 && items.every((item) => selected.has(item.id)),
    [items, selected],
  );

  function toggleParticipant(participant: EventParticipantDetailResponse) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(participant.id)) next.delete(participant.id);
      else next.set(participant.id, participant.name);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        items.forEach((item) => next.delete(item.id));
      } else {
        items.forEach((item) => next.set(item.id, item.name));
      }
      return next;
    });
  }

  function resetState() {
    setSearchInput('');
    setSearch('');
    setPage(1);
    setItems([]);
    setSelected(new Map());
  }

  async function handleSubmit() {
    if (selected.size === 0) return;

    setIsSubmitting(true);
    try {
      const response = await eventCheckinsClient.bulkCheckIn(eventId, { participantIds: [...selected.keys()] });
      if (!response.success) throw new Error(response.error.message);

      const { created, skipped, errors } = response.data;
      if (skipped.length > 0 || errors.length > 0) {
        toast.warning(
          t('pages.eventDetail.bulkCheckinPartial', {
            created: String(created),
            skipped: String(skipped.length),
            errors: String(errors.length),
          }),
        );
      } else {
        toast.success(t('pages.eventDetail.bulkCheckinSuccess', { count: String(created) }));
      }

      resetState();
      onOpenChange(false);
      await onCompleted();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.bulkCheckinError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('pages.eventDetail.manualCheckinTitle')}</DialogTitle>
          <DialogDescription>{t('pages.eventDetail.manualCheckinDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('pages.eventDetail.manualCheckinSearchPlaceholder')}
              className="pl-9"
            />
          </div>

          {items.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} />
              {t('pages.eventDetail.selectAllOnPage')}
            </label>
          )}

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-1">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {search ? t('pages.eventDetail.noCheckinsMatchSearch') : t('pages.eventDetail.allHaveCheckin')}
              </p>
            ) : (
              items.map((participant) => (
                <label
                  key={participant.id}
                  className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2"
                >
                  <Checkbox
                    checked={selected.has(participant.id)}
                    onCheckedChange={() => toggleParticipant(participant)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{participant.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {[participant.email, participant.company].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t('pages.eventDetail.pageOf', { page: String(page), total: String(totalPages) })}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  {t('pages.eventDetail.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t('pages.eventDetail.next')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">
              {selected.size > 0
                ? t('pages.eventDetail.selectedParticipantsCount', { count: String(selected.size) })
                : t('pages.eventDetail.results', { count: String(total) })}
            </span>
            {selected.size > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Map())}>
                {t('pages.eventDetail.clearSelection')}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('pages.eventDetail.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || selected.size === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('pages.eventDetail.saving')}
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                {t('pages.eventDetail.bulkCheckinAction', { count: String(selected.size) })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
