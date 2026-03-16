'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  Calendar,
  CheckCircle2,
  MapPin,
  MonitorSmartphone,
  Pencil,
  Plus,
  ScanFace,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { EventStatusBadge } from '@/components/organizations/events';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { eventsClient, participantsClient } from '@/core/application/client-services';
import type {
  EventCheckInDetailResponse,
  EventParticipantDetailResponse,
  EventTotemAvailableResponse,
  EventTotemSubscriptionResponse,
  PaginatedEventParticipantsResponse,
  PrintConfigSummaryResponse,
} from '@/core/application/client-services/events/events-client.service';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import type { EventResponse } from '@/core/communication/responses/event';

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString();
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

function calculateCheckInRate(total: number, checkedIn: number) {
  if (total === 0) return '0%';
  return `${Math.round((checkedIn / total) * 100)}%`;
}

const NONE_PRINT_CONFIG = '__none__';
const PARTICIPANTS_PAGE_SIZE = 20;

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const confirm = useConfirm();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [participants, setParticipants] = useState<EventParticipantDetailResponse[]>([]);
  const [participantsMeta, setParticipantsMeta] = useState<PaginatedEventParticipantsResponse>({
    items: [],
    page: 1,
    pageSize: PARTICIPANTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [participantsSearch, setParticipantsSearch] = useState('');
  const [participantsPage, setParticipantsPage] = useState(1);
  const [createParticipantOpen, setCreateParticipantOpen] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantDocument, setParticipantDocument] = useState('');
  const [participantDocumentType, setParticipantDocumentType] = useState<
    'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER' | ''
  >('');
  const [participantPhone, setParticipantPhone] = useState('');
  const [participantCompany, setParticipantCompany] = useState('');
  const [participantJobTitle, setParticipantJobTitle] = useState('');
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);
  const [totems, setTotems] = useState<EventTotemSubscriptionResponse[]>([]);
  const [availableTotems, setAvailableTotems] = useState<EventTotemAvailableResponse[]>([]);
  const [checkIns, setCheckIns] = useState<EventCheckInDetailResponse[]>([]);
  const [printConfigs, setPrintConfigs] = useState<PrintConfigSummaryResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isLoadingTotems, setIsLoadingTotems] = useState(false);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(false);

  const [assignTotemOpen, setAssignTotemOpen] = useState(false);
  const [assignTotemId, setAssignTotemId] = useState('');
  const [assignLocation, setAssignLocation] = useState('');
  const [assignStartsAt, setAssignStartsAt] = useState('');
  const [assignEndsAt, setAssignEndsAt] = useState('');
  const [isAssigningTotem, setIsAssigningTotem] = useState(false);

  const [editParticipant, setEditParticipant] = useState<EventParticipantDetailResponse | null>(null);
  const [viewParticipant, setViewParticipant] = useState<EventParticipantDetailResponse | null>(null);
  const [registerFaceParticipant, setRegisterFaceParticipant] = useState<EventParticipantDetailResponse | null>(null);

  const [editCompany, setEditCompany] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  const [faceEmbedding, setFaceEmbedding] = useState('');
  const [faceImageHash, setFaceImageHash] = useState('');
  const [faceImageUrl, setFaceImageUrl] = useState('');
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);

  const [changeLocationSub, setChangeLocationSub] = useState<EventTotemSubscriptionResponse | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsTimezone, setSettingsTimezone] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsStartsAt, setSettingsStartsAt] = useState('');
  const [settingsEndsAt, setSettingsEndsAt] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<EventResponse['status']>('DRAFT');
  const [settingsPrintConfigId, setSettingsPrintConfigId] = useState<string>(NONE_PRINT_CONFIG);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingPrintConfig, setIsCreatingPrintConfig] = useState(false);

  const isLoadingPage = isAppLoading || isAuthLoading;

  const canView = isSuperAdmin() || hasPermission('EVENT_VIEW');

  const stats = useMemo(() => {
    const totalParticipants = participantsMeta.total;
    const checkedIn = checkIns.length;
    const totalTotems = totems.length;
    return {
      totalParticipants,
      checkedIn,
      totalTotems,
      checkInRate: calculateCheckInRate(totalParticipants, checkedIn),
    };
  }, [participantsMeta.total, checkIns.length, totems.length]);

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await eventsClient.getEventById(eventId);
      if (!response.success) {
        throw new Error(response.error.message);
      }
      setEvent(response.data);
      setSettingsName(response.data.name);
      setSettingsDescription(response.data.description ?? '');
      setSettingsTimezone(response.data.timezone);
      setSettingsAddress(response.data.address ?? '');
      setSettingsStartsAt(new Date(response.data.startsAt).toISOString().slice(0, 16));
      setSettingsEndsAt(new Date(response.data.endsAt).toISOString().slice(0, 16));
      setSettingsStatus(response.data.status);
      setSettingsPrintConfigId(response.data.printConfigId ?? NONE_PRINT_CONFIG);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load event.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const loadParticipants = useCallback(async () => {
    setIsLoadingParticipants(true);
    try {
      const response = await eventsClient.listEventParticipants(eventId, {
        page: participantsPage,
        pageSize: PARTICIPANTS_PAGE_SIZE,
        search: participantsSearch,
      });
      if (!response.success) throw new Error(response.error.message);
      setParticipants(response.data.items);
      setParticipantsMeta(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load participants.';
      toast.error(message);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [eventId, participantsPage, participantsSearch]);

  function resetCreateParticipantForm() {
    setParticipantName('');
    setParticipantEmail('');
    setParticipantDocument('');
    setParticipantDocumentType('');
    setParticipantPhone('');
    setParticipantCompany('');
    setParticipantJobTitle('');
  }

  async function handleCreateParticipant(e: React.FormEvent) {
    e.preventDefault();

    setIsCreatingParticipant(true);
    try {
      const response = await participantsClient.createParticipant({
        eventId,
        name: participantName.trim(),
        email: participantEmail.trim(),
        document: participantDocument.trim() || null,
        documentType: participantDocumentType || null,
        phone: participantPhone.trim() || null,
        company: participantCompany.trim() || null,
        jobTitle: participantJobTitle.trim() || null,
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      toast.success('Participant added successfully.');
      setCreateParticipantOpen(false);
      resetCreateParticipantForm();
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add participant.';
      toast.error(message);
    } finally {
      setIsCreatingParticipant(false);
    }
  }

  const loadTotems = useCallback(async () => {
    setIsLoadingTotems(true);
    try {
      const response = await eventsClient.listEventTotems(eventId);
      if (!response.success) throw new Error(response.error.message);
      setTotems(response.data.assigned);
      setAvailableTotems(response.data.available);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load totems.';
      toast.error(message);
    } finally {
      setIsLoadingTotems(false);
    }
  }, [eventId]);

  const loadCheckIns = useCallback(async () => {
    setIsLoadingCheckIns(true);
    try {
      const response = await eventsClient.listEventCheckIns(eventId);
      if (!response.success) throw new Error(response.error.message);
      setCheckIns(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load check-ins.';
      toast.error(message);
    } finally {
      setIsLoadingCheckIns(false);
    }
  }, [eventId]);

  const loadPrintConfigs = useCallback(async () => {
    const response = await eventsClient.listPrintConfigs();
    if (response.success) {
      setPrintConfigs(response.data);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || !canView)) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, canView, router]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      loadEvent();
      loadParticipants();
      loadTotems();
      loadCheckIns();
      loadPrintConfigs();
    }
  }, [isAuthenticated, canView, loadEvent, loadParticipants, loadTotems, loadCheckIns, loadPrintConfigs]);

  useEffect(() => {
    if (editParticipant) {
      setEditCompany(editParticipant.company ?? '');
      setEditJobTitle(editParticipant.jobTitle ?? '');
    }
  }, [editParticipant]);

  useEffect(() => {
    if (changeLocationSub) {
      setNewLocation(changeLocationSub.locationName);
    }
  }, [changeLocationSub]);

  async function handleAssignTotem(e: React.FormEvent) {
    e.preventDefault();

    if (!assignTotemId || !assignLocation.trim() || !assignStartsAt || !assignEndsAt) return;

    const startDate = new Date(assignStartsAt);
    const endDate = new Date(assignEndsAt);

    if (startDate >= endDate) {
      toast.error('Start date must be before end date.');
      return;
    }

    setIsAssigningTotem(true);
    try {
      await eventsClient.assignTotemToEvent(eventId, {
        eventId,
        locationName: assignLocation.trim(),
        totemOrganizationSubscriptionId: assignTotemId,
        startsAt: startDate,
        endsAt: endDate,
      });
      toast.success('Totem assigned successfully.');
      setAssignTotemOpen(false);
      setAssignTotemId('');
      setAssignLocation('');
      setAssignStartsAt('');
      setAssignEndsAt('');
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign totem.';
      toast.error(message);
    } finally {
      setIsAssigningTotem(false);
    }
  }

  async function handleRemoveTotem(sub: EventTotemSubscriptionResponse) {
    const accepted = await confirm.confirm({
      title: 'Remove totem',
      description: `Remove ${sub.totemName} from this event?`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });

    if (!accepted) return;

    try {
      await eventsClient.removeTotemFromEvent(eventId, sub.id);
      toast.success('Totem removed.');
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove totem.';
      toast.error(message);
    }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!changeLocationSub) return;

    setIsUpdatingLocation(true);
    try {
      await eventsClient.updateTotemLocation(eventId, changeLocationSub.id, { locationName: newLocation.trim() });
      toast.success('Totem location updated.');
      setChangeLocationSub(null);
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update location.';
      toast.error(message);
    } finally {
      setIsUpdatingLocation(false);
    }
  }

  async function handleSaveParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!editParticipant) return;

    setIsSavingParticipant(true);
    try {
      await participantsClient.updateParticipant(editParticipant.id, {
        company: editCompany.trim() || null,
        jobTitle: editJobTitle.trim() || null,
      });
      toast.success('Participant updated.');
      setEditParticipant(null);
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update participant.';
      toast.error(message);
    } finally {
      setIsSavingParticipant(false);
    }
  }

  async function handleDeleteParticipant(participant: EventParticipantDetailResponse) {
    const accepted = await confirm.confirm({
      title: 'Delete participant',
      description: `Remove ${participant.name} from this event?`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });

    if (!accepted) return;

    try {
      await participantsClient.deleteParticipant(participant.id);
      toast.success('Participant removed.');
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove participant.';
      toast.error(message);
    }
  }

  async function handleRegisterFace(e: React.FormEvent) {
    e.preventDefault();
    if (!registerFaceParticipant) return;

    setIsRegisteringFace(true);
    try {
      await participantsClient.registerFace({
        personId: registerFaceParticipant.personId,
        embedding: faceEmbedding.trim(),
        imageHash: faceImageHash.trim(),
        imageUrl: faceImageUrl.trim(),
      });
      toast.success('Face registered.');
      setRegisterFaceParticipant(null);
      setFaceEmbedding('');
      setFaceImageHash('');
      setFaceImageUrl('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register face.';
      toast.error(message);
    } finally {
      setIsRegisteringFace(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();

    if (!event) return;

    const startDate = new Date(settingsStartsAt);
    const endDate = new Date(settingsEndsAt);

    if (startDate >= endDate) {
      toast.error('Start date must be before end date.');
      return;
    }

    setIsSavingSettings(true);
    try {
      await eventsClient.updateEvent(event.id, {
        name: settingsName.trim(),
        description: settingsDescription.trim() || null,
        timezone: settingsTimezone.trim(),
        address: settingsAddress.trim() || null,
        startsAt: startDate,
        endsAt: endDate,
        printConfigId: settingsPrintConfigId === NONE_PRINT_CONFIG ? null : settingsPrintConfigId,
      });

      if (settingsStatus !== event.status) {
        const transition = `${event.status}->${settingsStatus}`;
        if (transition === 'DRAFT->PUBLISHED') {
          await eventsClient.publishEvent(event.id);
        } else if (transition === 'PUBLISHED->ACTIVE') {
          await eventsClient.activateEvent(event.id);
        } else if (transition === 'ACTIVE->COMPLETED') {
          await eventsClient.completeEvent(event.id);
        } else if (
          (event.status === 'DRAFT' || event.status === 'PUBLISHED' || event.status === 'ACTIVE') &&
          settingsStatus === 'CANCELED'
        ) {
          await eventsClient.cancelEvent(event.id);
        } else {
          toast.error('Invalid status transition.');
          return;
        }
      }

      toast.success('Event updated.');
      loadEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update event.';
      toast.error(message);
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleCreatePrintConfig() {
    setIsCreatingPrintConfig(true);
    try {
      const response = await eventsClient.createDefaultPrintConfig();
      if (!response.success) throw new Error(response.error.message);
      setPrintConfigs((prev) => [response.data, ...prev]);
      setSettingsPrintConfigId(response.data.id);
      toast.success('Print config created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create print config.';
      toast.error(message);
    } finally {
      setIsCreatingPrintConfig(false);
    }
  }

  if (isLoadingPage || !isAuthenticated || !canView) {
    return null;
  }

  if (isLoading || !event) {
    return <DetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-muted-foreground text-sm">{event.slug}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="totems">Totems</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Participants Registered"
              value={stats.totalParticipants}
              icon={<User className="h-4 w-4" />}
            />
            <StatCard title="Check-ins Completed" value={stats.checkedIn} icon={<CheckCircle2 className="h-4 w-4" />} />
            <StatCard
              title="Totems Assigned"
              value={stats.totalTotems}
              icon={<MonitorSmartphone className="h-4 w-4" />}
            />
            <StatCard title="Check-in Rate" value={stats.checkInRate} icon={<ScanFace className="h-4 w-4" />} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Key information about this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Start date"
                value={formatDateTime(event.startsAt)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow label="End date" value={formatDateTime(event.endsAt)} icon={<Calendar className="h-4 w-4" />} />
              <InfoRow label="Timezone" value={event.timezone} icon={<Calendar className="h-4 w-4" />} />
              <InfoRow label="Location" value={event.address ?? '—'} icon={<MapPin className="h-4 w-4" />} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>{participantsMeta.total} registered participants.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateParticipantOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Participant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4 max-w-md">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={participantsSearch}
                  onChange={(e) => {
                    setParticipantsSearch(e.target.value);
                    setParticipantsPage(1);
                  }}
                  placeholder="Search participants"
                  className="pl-9"
                />
              </div>

              {isLoadingParticipants ? (
                <Skeleton className="h-40" />
              ) : participants.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No participants registered yet.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Registered At</TableHead>
                        <TableHead>Check-in Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell className="text-muted-foreground">{participant.email}</TableCell>
                          <TableCell className="text-muted-foreground">{participant.company ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{participant.jobTitle ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(participant.registeredAt)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                participant.hasCheckIn
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-gray-400/10 text-gray-500'
                              }
                            >
                              {participant.hasCheckIn ? 'Checked-in' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewParticipant(participant)}>
                              <User className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditParticipant(participant)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setRegisterFaceParticipant(participant)}>
                              <ScanFace className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteParticipant(participant)}>
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{participantsMeta.total} results</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={participantsMeta.page <= 1}
                    onClick={() => setParticipantsPage((current) => Math.max(current - 1, 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {participantsMeta.page} of {participantsMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={participantsMeta.page >= participantsMeta.totalPages}
                    onClick={() => setParticipantsPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="totems" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Totems</CardTitle>
                  <CardDescription>{totems.length} totems assigned to this event.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setAssignTotemOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Totem
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTotems ? (
                <Skeleton className="h-40" />
              ) : totems.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No totems assigned yet.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Totem Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Heartbeat</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {totems.map((totem) => (
                        <TableRow key={totem.id}>
                          <TableCell className="font-medium">{totem.totemName}</TableCell>
                          <TableCell className="text-muted-foreground">{totem.locationName}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                totem.totemStatus === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-gray-400/10 text-gray-500'
                              }
                            >
                              {totem.totemStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {totem.lastHeartbeat ? formatDateTime(totem.lastHeartbeat) : '—'}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setChangeLocationSub(totem)}>
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveTotem(totem)}>
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Check-ins</CardTitle>
              <CardDescription>{checkIns.length} completed check-ins.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCheckIns ? (
                <Skeleton className="h-40" />
              ) : checkIns.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No check-ins yet.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Totem Location</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkIns.map((checkIn) => (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium">{checkIn.participantName}</TableCell>
                          <TableCell className="text-muted-foreground">{checkIn.method}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {checkIn.confidence ? `${Math.round(checkIn.confidence * 100)}%` : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{checkIn.totemLocation}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(checkIn.checkedInAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Update event configuration and print settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Name *</Label>
                    <Input
                      id="settings-name"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-status">Status</Label>
                    <Select
                      value={settingsStatus}
                      onValueChange={(value) => setSettingsStatus(value as EventResponse['status'])}
                    >
                      <SelectTrigger id="settings-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        <SelectItem value="CANCELED">CANCELED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-description">Description</Label>
                  <Textarea
                    id="settings-description"
                    value={settingsDescription}
                    onChange={(e) => setSettingsDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-timezone">Timezone *</Label>
                    <Input
                      id="settings-timezone"
                      value={settingsTimezone}
                      onChange={(e) => setSettingsTimezone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-address">Address</Label>
                    <Input
                      id="settings-address"
                      value={settingsAddress}
                      onChange={(e) => setSettingsAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-start">Start Date *</Label>
                    <Input
                      id="settings-start"
                      type="datetime-local"
                      value={settingsStartsAt}
                      onChange={(e) => setSettingsStartsAt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-end">End Date *</Label>
                    <Input
                      id="settings-end"
                      type="datetime-local"
                      value={settingsEndsAt}
                      onChange={(e) => setSettingsEndsAt(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Print Config</Label>
                  <div className="flex gap-2">
                    <Select value={settingsPrintConfigId} onValueChange={setSettingsPrintConfigId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select print config" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_PRINT_CONFIG}>None</SelectItem>
                        {printConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreatePrintConfig}
                      disabled={isCreatingPrintConfig}
                    >
                      {isCreatingPrintConfig ? 'Creating...' : 'Create new'}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignTotemOpen} onOpenChange={setAssignTotemOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Totem</DialogTitle>
            <DialogDescription>Assign an available totem to this event.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTotem} className="space-y-4">
            <div className="space-y-2">
              <Label>Totem</Label>
              <Select value={assignTotemId} onValueChange={setAssignTotemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select totem" />
                </SelectTrigger>
                <SelectContent>
                  {availableTotems.map((totem) => (
                    <SelectItem
                      key={totem.totemOrganizationSubscriptionId}
                      value={totem.totemOrganizationSubscriptionId}
                    >
                      {totem.totemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-location">Location *</Label>
              <Input
                id="assign-location"
                value={assignLocation}
                onChange={(e) => setAssignLocation(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assign-start">Start Date *</Label>
                <Input
                  id="assign-start"
                  type="datetime-local"
                  value={assignStartsAt}
                  onChange={(e) => setAssignStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-end">End Date *</Label>
                <Input
                  id="assign-end"
                  type="datetime-local"
                  value={assignEndsAt}
                  onChange={(e) => setAssignEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignTotemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAssigningTotem}>
                {isAssigningTotem ? 'Assigning...' : 'Assign Totem'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createParticipantOpen}
        onOpenChange={(open) => {
          setCreateParticipantOpen(open);
          if (!open) resetCreateParticipantForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              The system will reuse an existing person from this organization by email or create a new one.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateParticipant} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-name">Name *</Label>
                <Input
                  id="participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant-email">Email *</Label>
                <Input
                  id="participant-email"
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-document">Document</Label>
                <Input
                  id="participant-document"
                  value={participantDocument}
                  onChange={(e) => setParticipantDocument(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={participantDocumentType}
                  onValueChange={(value) =>
                    setParticipantDocumentType(value as 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER' | '')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="ID_CARD">ID card</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">Driver license</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-phone">Phone</Label>
                <Input
                  id="participant-phone"
                  value={participantPhone}
                  onChange={(e) => setParticipantPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant-company">Company</Label>
                <Input
                  id="participant-company"
                  value={participantCompany}
                  onChange={(e) => setParticipantCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-job-title">Job Title</Label>
              <Input
                id="participant-job-title"
                value={participantJobTitle}
                onChange={(e) => setParticipantJobTitle(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateParticipantOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingParticipant || !participantName || !participantEmail}>
                {isCreatingParticipant ? 'Saving...' : 'Add Participant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changeLocationSub} onOpenChange={(open) => !open && setChangeLocationSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Location</DialogTitle>
            <DialogDescription>Update the location for this totem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-location">Location *</Label>
              <Input id="new-location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangeLocationSub(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingLocation}>
                {isUpdatingLocation ? 'Saving...' : 'Save Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editParticipant} onOpenChange={(open) => !open && setEditParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>Update participant details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveParticipant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input id="edit-company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-title">Job Title</Label>
              <Input id="edit-job-title" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditParticipant(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingParticipant}>
                {isSavingParticipant ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewParticipant} onOpenChange={(open) => !open && setViewParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participant</DialogTitle>
            <DialogDescription>Participant details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <InfoRow label="Name" value={viewParticipant?.name ?? ''} />
            <InfoRow label="Email" value={viewParticipant?.email ?? ''} />
            <InfoRow label="Company" value={viewParticipant?.company ?? '—'} />
            <InfoRow label="Job Title" value={viewParticipant?.jobTitle ?? '—'} />
            <InfoRow
              label="Registered At"
              value={viewParticipant ? formatDateTime(viewParticipant.registeredAt) : ''}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!registerFaceParticipant} onOpenChange={(open) => !open && setRegisterFaceParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register Face</DialogTitle>
            <DialogDescription>Attach a face to this participant.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterFace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="face-embedding">Embedding *</Label>
              <Textarea
                id="face-embedding"
                value={faceEmbedding}
                onChange={(e) => setFaceEmbedding(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="face-hash">Image Hash *</Label>
              <Input id="face-hash" value={faceImageHash} onChange={(e) => setFaceImageHash(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="face-url">Image URL *</Label>
              <Input
                id="face-url"
                type="url"
                value={faceImageUrl}
                onChange={(e) => setFaceImageUrl(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegisterFaceParticipant(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isRegisteringFace}>
                {isRegisteringFace ? 'Saving...' : 'Register Face'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
