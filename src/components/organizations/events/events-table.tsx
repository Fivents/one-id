'use client';

import Link from 'next/link';

import { CalendarPlus, CheckCircle, Edit, Eye, MoreHorizontal, Play, Plus, Send, Trash2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EventSummaryResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';
import { formatDateTimeRange } from '@/lib/utils';

import { EventStatusBadge } from './event-status-badge';

interface EventsTableProps {
  organizationId: string;
  events: EventSummaryResponse[];
  isLoading: boolean;
  onEdit: (event: EventSummaryResponse) => void;
  onDelete: (event: EventSummaryResponse) => void;
  onPublish: (event: EventSummaryResponse) => void;
  onActivate: (event: EventSummaryResponse) => void;
  onComplete: (event: EventSummaryResponse) => void;
  onCancel: (event: EventSummaryResponse) => void;
  /** When provided, the empty state offers to create the first event. */
  onCreate?: () => void;
}

function canPublish(status: EventSummaryResponse['status']) {
  return status === 'DRAFT';
}

function canActivate(status: EventSummaryResponse['status']) {
  return status === 'PUBLISHED';
}

function canComplete(status: EventSummaryResponse['status']) {
  return status === 'ACTIVE';
}

function canCancel(status: EventSummaryResponse['status']) {
  return status !== 'COMPLETED' && status !== 'CANCELED';
}

export function EventsTable({
  organizationId,
  events,
  isLoading,
  onEdit,
  onDelete,
  onPublish,
  onActivate,
  onComplete,
  onCancel,
  onCreate,
}: EventsTableProps) {
  const { t, locale } = useI18n();
  if (isLoading) {
    return <EventsTableSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="bg-card flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-2xl">
          <CalendarPlus className="size-6" />
        </div>
        <p className="font-medium">{t('pages.organizationEvents.noEventsTitle')}</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {t('pages.organizationEvents.noEventsDescription')}
        </p>
        {onCreate && (
          <Button className="mt-5" onClick={onCreate}>
            <Plus className="size-4" />
            {t('pages.organizationEvents.createEvent')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">{t('pages.eventsTable.columnName')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnStatus')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnPeriod')}</TableHead>
            <TableHead className="text-right">{t('pages.eventsTable.columnParticipants')}</TableHead>
            <TableHead className="text-right">{t('pages.eventsTable.columnCheckins')}</TableHead>
            <TableHead className="text-right">{t('pages.eventsTable.columnTotems')}</TableHead>
            <TableHead className="hidden xl:table-cell">{t('pages.eventsTable.columnCreatedAt')}</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{t('pages.eventsTable.columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="group">
              <TableCell className="max-w-[320px] py-3 pl-4">
                <Link
                  href={`/organizations/${organizationId}/events/${event.id}`}
                  className="group-hover:text-primary focus-visible:ring-ring/50 block truncate rounded-sm font-medium transition-colors outline-none focus-visible:ring-2"
                >
                  {event.name}
                </Link>
                <span className="text-muted-foreground block truncate font-mono text-xs">{event.slug}</span>
              </TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTimeRange(event.startsAt, event.endsAt, locale)}
              </TableCell>
              <TableCell className="text-right">{event.participantsCount.toLocaleString(locale)}</TableCell>
              <TableCell className="text-right">{event.checkInsCount.toLocaleString(locale)}</TableCell>
              <TableCell className="text-muted-foreground text-right">{event.totemsCount}</TableCell>
              <TableCell className="text-muted-foreground hidden xl:table-cell">
                {new Date(event.createdAt).toLocaleDateString(locale)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`${t('nav.shell.moreActions')}: ${event.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/organizations/${organizationId}/events/${event.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('common.actions.viewDetails')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(event)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onPublish(event)} disabled={!canPublish(event.status)}>
                      <Send className="mr-2 h-4 w-4" />
                      {t('pages.organizationEvents.publishEvent')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onActivate(event)} disabled={!canActivate(event.status)}>
                      <Play className="mr-2 h-4 w-4" />
                      {t('pages.organizationEvents.activateEvent')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onComplete(event)} disabled={!canComplete(event.status)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t('pages.organizationEvents.completeEvent')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCancel(event)} disabled={!canCancel(event.status)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('pages.organizationEvents.cancelEvent')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(event)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EventsTableSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 8 }).map((__, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
