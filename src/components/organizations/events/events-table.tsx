'use client';

import Link from 'next/link';

import { CheckCircle, Edit, Eye, MoreHorizontal, Play, Send, Trash2, XCircle } from 'lucide-react';

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
}: EventsTableProps) {
  const { t } = useI18n();
  if (isLoading) {
    return <EventsTableSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-muted-foreground text-sm">{t('pages.organizationEvents.noEventsTitle')}</p>
        <p className="text-muted-foreground text-sm">{t('pages.organizationEvents.noEventsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pages.eventsTable.columnName')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnSlug')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnStatus')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnStartDate')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnEndDate')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnParticipants')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnCheckins')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnTotems')}</TableHead>
            <TableHead>{t('pages.eventsTable.columnCreatedAt')}</TableHead>
            <TableHead className="w-17.5">{t('pages.eventsTable.columnActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell>
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{event.slug}</code>
              </TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(event.startsAt).toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(event.endsAt).toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{event.participantsCount}</TableCell>
              <TableCell className="text-muted-foreground">{event.checkInsCount}</TableCell>
              <TableCell className="text-muted-foreground">{event.totemsCount}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(event.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 10 }).map((__, cell) => (
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
