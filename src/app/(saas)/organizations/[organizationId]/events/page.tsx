'use client';

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { CreateEventModal, EditEventModal, EventsTable } from '@/components/organizations/events';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  EventsProvider,
  useApp,
  useAuth,
  useEvents,
  useOrganization,
  usePermissions,
} from '@/core/application/contexts';
import type { EventSummaryResponse } from '@/core/communication/responses/event';

function EventsPageContent() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isLoading: isOrganizationsLoading,
  } = useOrganization();
  const { role, hasPermission, isSuperAdmin } = usePermissions();
  const { events, isLoading, fetchEvents, deleteEvent, publishEvent, activateEvent, completeEvent, cancelEvent } =
    useEvents();

  const confirm = useConfirm();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventSummaryResponse | null>(null);

  const isLoadingPage = isAppLoading || isAuthLoading || isOrganizationsLoading;
  const hasOrganizationAccess = organizations.some((organization) => organization.id === organizationId);

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || (!isSuperAdmin() && !hasPermission('EVENT_VIEW')))) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, hasPermission, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && organizationId && (isSuperAdmin() || hasPermission('EVENT_VIEW'))) {
      if (!hasOrganizationAccess) {
        if (organizations.length > 0) {
          router.replace(`/organizations/${organizations[0].id}/events`);
        }
        return;
      }

      fetchEvents(organizationId);
    }
  }, [
    isAuthenticated,
    organizationId,
    fetchEvents,
    hasPermission,
    hasOrganizationAccess,
    isSuperAdmin,
    organizations,
    router,
  ]);

  const handleOrganizationChange = useCallback(
    (nextOrganizationId: string) => {
      const selectedOrganization = organizations.find((organization) => organization.id === nextOrganizationId);
      if (!selectedOrganization) {
        return;
      }

      setActiveOrganization(selectedOrganization);
      router.push(`/organizations/${selectedOrganization.id}/events`);
    },
    [organizations, router, setActiveOrganization],
  );

  const handleEdit = useCallback((event: EventSummaryResponse) => {
    setEditEvent(event);
  }, []);

  const handleDelete = useCallback(
    async (event: EventSummaryResponse) => {
      const accepted = await confirm.confirm({
        title: 'Delete event',
        description: `This will permanently remove ${event.name}.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        requireText: event.slug,
      });

      if (!accepted) return;

      try {
        await deleteEvent(event.id);
        toast.success('Event deleted successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete event.';
        toast.error(message);
      }
    },
    [confirm, deleteEvent],
  );

  const handleStatusChange = useCallback(
    async (event: EventSummaryResponse, action: 'publish' | 'activate' | 'complete' | 'cancel') => {
      const labels = {
        publish: 'Publish Event',
        activate: 'Activate Event',
        complete: 'Complete Event',
        cancel: 'Cancel Event',
      };

      const accepted = await confirm.confirm({
        title: labels[action],
        description: `Do you want to ${action} ${event.name}?`,
        confirmLabel: labels[action],
        variant: action === 'cancel' ? 'destructive' : 'default',
      });

      if (!accepted) return;

      try {
        if (action === 'publish') await publishEvent(event.id);
        if (action === 'activate') await activateEvent(event.id);
        if (action === 'complete') await completeEvent(event.id);
        if (action === 'cancel') await cancelEvent(event.id);

        toast.success('Event status updated.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update event status.';
        toast.error(message);
      }
    },
    [confirm, publishEvent, activateEvent, completeEvent, cancelEvent],
  );

  if (isLoadingPage || !isAuthenticated || (!isSuperAdmin() && !hasPermission('EVENT_VIEW'))) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Calendar className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground text-sm">
              Manage events for {activeOrganization?.name ?? 'the selected organization'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {organizations.length > 0 && (
            <Select value={organizationId} onValueChange={handleOrganizationChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(role === 'ORG_OWNER' || role === 'EVENT_MANAGER' || isSuperAdmin()) && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      <EventsTable
        organizationId={organizationId}
        events={events}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPublish={(event) => handleStatusChange(event, 'publish')}
        onActivate={(event) => handleStatusChange(event, 'activate')}
        onComplete={(event) => handleStatusChange(event, 'complete')}
        onCancel={(event) => handleStatusChange(event, 'cancel')}
      />

      <CreateEventModal open={createModalOpen} onOpenChange={setCreateModalOpen} organizationId={organizationId} />

      <EditEventModal
        event={editEvent}
        open={!!editEvent}
        onOpenChange={(open) => {
          if (!open) setEditEvent(null);
        }}
      />
    </div>
  );
}

export default function EventsPage() {
  return (
    <EventsProvider>
      <EventsPageContent />
    </EventsProvider>
  );
}
