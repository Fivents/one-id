'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Edit, ScanFace, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { participantsClient, peopleClient } from '@/core/application/client-services';
import type {
  PaginatedPeopleResponse,
  PersonEventLinkResponse,
  PersonSummaryResponse,
} from '@/core/application/client-services/people-client.service';
import { useApp, useAuth, useOrganization, usePermissions } from '@/core/application/contexts';

const PAGE_SIZE = 20;

type ActiveTab = 'active' | 'deleted';

type DocumentType = 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER';

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-muted-foreground text-sm">{total} results</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default function OrganizationPeoplePage() {
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
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canView = isSuperAdmin() || hasPermission('PARTICIPANT_VIEW');
  const canManage = isSuperAdmin() || hasPermission('PARTICIPANT_MANAGE');

  const isLoadingPage = isAppLoading || isAuthLoading || isOrganizationsLoading;
  const hasOrganizationAccess = organizations.some((organization) => organization.id === organizationId);

  const confirm = useConfirm();

  const [tab, setTab] = useState<ActiveTab>('active');
  const [search, setSearch] = useState('');

  const [activePage, setActivePage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [activePeople, setActivePeople] = useState<PaginatedPeopleResponse>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [deletedPeople, setDeletedPeople] = useState<PaginatedPeopleResponse>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [selectedActiveIds, setSelectedActiveIds] = useState<Set<string>>(new Set());
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<PersonSummaryResponse | null>(null);
  const [manageEventsPerson, setManageEventsPerson] = useState<PersonSummaryResponse | null>(null);
  const [manageFacePerson, setManageFacePerson] = useState<PersonSummaryResponse | null>(null);
  const [personEvents, setPersonEvents] = useState<PersonEventLinkResponse[]>([]);
  const [isLoadingPersonEvents, setIsLoadingPersonEvents] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formDocumentType, setFormDocumentType] = useState<DocumentType | ''>('');
  const [formPhone, setFormPhone] = useState('');
  const [createFaceImageUrl, setCreateFaceImageUrl] = useState('');
  const [createFaceImageDataUrl, setCreateFaceImageDataUrl] = useState('');
  const [isCreateFaceCameraOpen, setIsCreateFaceCameraOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const createFaceVideoRef = useRef<HTMLVideoElement | null>(null);
  const createFaceCameraStreamRef = useRef<MediaStream | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState('');
  const [faceImageDataUrl, setFaceImageDataUrl] = useState('');
  const [isFaceCameraOpen, setIsFaceCameraOpen] = useState(false);
  const [isSavingFace, setIsSavingFace] = useState(false);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceCameraStreamRef = useRef<MediaStream | null>(null);

  const allActiveSelected = useMemo(() => {
    return activePeople.items.length > 0 && activePeople.items.every((person) => selectedActiveIds.has(person.id));
  }, [activePeople.items, selectedActiveIds]);

  const allDeletedSelected = useMemo(() => {
    return deletedPeople.items.length > 0 && deletedPeople.items.every((person) => selectedDeletedIds.has(person.id));
  }, [deletedPeople.items, selectedDeletedIds]);

  const loadPeople = useCallback(
    async (targetTab: ActiveTab) => {
      if (!organizationId) return;

      setIsLoading(true);
      try {
        if (targetTab === 'active') {
          const response = await peopleClient.listPeople({
            organizationId,
            page: activePage,
            pageSize: PAGE_SIZE,
            search,
          });

          if (!response.success) throw new Error(response.error.message);
          setActivePeople(response.data);
          setSelectedActiveIds(new Set());
        } else {
          const response = await peopleClient.listPeople({
            organizationId,
            page: deletedPage,
            pageSize: PAGE_SIZE,
            search,
            deleted: true,
          });

          if (!response.success) throw new Error(response.error.message);
          setDeletedPeople(response.data);
          setSelectedDeletedIds(new Set());
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load people.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, activePage, deletedPage, search],
  );

  const loadPersonEvents = useCallback(async (personId: string) => {
    setIsLoadingPersonEvents(true);
    try {
      const response = await peopleClient.listPersonEvents(personId);
      if (!response.success) throw new Error(response.error.message);
      setPersonEvents(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load person events.';
      toast.error(message);
    } finally {
      setIsLoadingPersonEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || !canView)) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, canView, router]);

  useEffect(() => {
    if (!isAuthenticated || !canView) return;

    if (!hasOrganizationAccess) {
      if (organizations.length > 0) {
        router.replace(`/organizations/${organizations[0].id}/people`);
      }
      return;
    }

    loadPeople(tab);
  }, [isAuthenticated, canView, hasOrganizationAccess, organizations, router, tab, loadPeople]);

  const handleOrganizationChange = useCallback(
    (nextOrganizationId: string) => {
      const selectedOrganization = organizations.find((organization) => organization.id === nextOrganizationId);
      if (!selectedOrganization) return;

      setActiveOrganization(selectedOrganization);
      router.push(`/organizations/${selectedOrganization.id}/people`);
    },
    [organizations, router, setActiveOrganization],
  );

  const stopCreateFaceCamera = useCallback(() => {
    const stream = createFaceCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      createFaceCameraStreamRef.current = null;
    }
    setIsCreateFaceCameraOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormEmail('');
    setFormDocument('');
    setFormDocumentType('');
    setFormPhone('');
    setCreateFaceImageUrl('');
    setCreateFaceImageDataUrl('');
    stopCreateFaceCamera();
  }, [stopCreateFaceCamera]);

  useEffect(() => {
    return () => {
      stopCreateFaceCamera();
    };
  }, [stopCreateFaceCamera]);

  useEffect(() => {
    if (!isCreateFaceCameraOpen || !createFaceVideoRef.current || !createFaceCameraStreamRef.current) {
      return;
    }

    const video = createFaceVideoRef.current;
    video.srcObject = createFaceCameraStreamRef.current;
    void video.play().catch(() => null);
  }, [isCreateFaceCameraOpen]);

  const openCreateFaceCamera = useCallback(async () => {
    try {
      stopCreateFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      createFaceCameraStreamRef.current = stream;
      setIsCreateFaceCameraOpen(true);
      setCreateFaceImageUrl('');
    } catch {
      toast.error('Could not access webcam. Check browser permissions.');
    }
  }, [stopCreateFaceCamera]);

  const captureCreateFacePhoto = useCallback(() => {
    const video = createFaceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Unable to capture photo from camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setCreateFaceImageDataUrl(captured);
    setCreateFaceImageUrl('');
    stopCreateFaceCamera();
  }, [stopCreateFaceCamera]);

  const openEditModal = useCallback((person: PersonSummaryResponse) => {
    setEditPerson(person);
    setFormName(person.name);
    setFormEmail(person.email);
    setFormDocument(person.document ?? '');
    setFormDocumentType((person.documentType as DocumentType | null) ?? '');
    setFormPhone(person.phone ?? '');
  }, []);

  const handleCreateOrUpdate = useCallback(
    async (isEdit: boolean) => {
      if (!canManage) return;

      setIsSubmittingForm(true);
      try {
        if (isEdit && editPerson) {
          const response = await peopleClient.updatePerson(editPerson.id, {
            name: formName,
            email: formEmail,
            document: formDocument || null,
            documentType: formDocumentType || null,
            phone: formPhone || null,
          });

          if (!response.success) throw new Error(response.error.message);
          toast.success('Person updated successfully.');
          setEditPerson(null);
        } else {
          const response = await peopleClient.createPerson({
            name: formName,
            email: formEmail,
            document: formDocument || null,
            documentType: formDocumentType || null,
            phone: formPhone || null,
            organizationId,
          });

          if (!response.success) throw new Error(response.error.message);

          const normalizedFaceImageUrl = createFaceImageUrl.trim();
          const normalizedFaceImageDataUrl = createFaceImageDataUrl.trim();
          if (normalizedFaceImageUrl || normalizedFaceImageDataUrl) {
            const faceResponse = await participantsClient.registerFace({
              personId: response.data.id,
              imageUrl: normalizedFaceImageUrl || undefined,
              imageDataUrl: normalizedFaceImageDataUrl || undefined,
            });

            if (!faceResponse.success) throw new Error(faceResponse.error.message);
          }

          toast.success('Person created successfully.');
          setCreateOpen(false);
        }

        resetForm();
        await loadPeople(tab);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save person.';
        toast.error(message);
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [
      canManage,
      editPerson,
      formName,
      formEmail,
      formDocument,
      formDocumentType,
      formPhone,
      createFaceImageUrl,
      createFaceImageDataUrl,
      organizationId,
      resetForm,
      loadPeople,
      tab,
    ],
  );

  const handleSoftDelete = useCallback(
    async (person: PersonSummaryResponse) => {
      if (!canManage) return;

      const accepted = await confirm.confirm({
        title: 'Delete person',
        description: `Move ${person.name} to deleted list?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });

      if (!accepted) return;

      const response = await peopleClient.softDeletePerson(person.id);
      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Person deleted successfully.');
      await loadPeople('active');
      await loadPeople('deleted');
    },
    [canManage, confirm, loadPeople],
  );

  const handleHardDelete = useCallback(
    async (person: PersonSummaryResponse) => {
      if (!canManage) return;

      const accepted = await confirm.confirm({
        title: 'Hard delete person',
        description: `This will permanently remove ${person.name} and related records.`,
        confirmLabel: 'Hard delete',
        variant: 'destructive',
      });

      if (!accepted) return;

      const response = await peopleClient.hardDeletePerson(person.id);
      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Person permanently removed.');
      await loadPeople('deleted');
    },
    [canManage, confirm, loadPeople],
  );

  const handleBulkSoftDelete = useCallback(async () => {
    if (!canManage || selectedActiveIds.size === 0) return;

    const accepted = await confirm.confirm({
      title: 'Delete selected people',
      description: `Delete ${selectedActiveIds.size} selected people?`,
      confirmLabel: 'Delete selected',
      variant: 'destructive',
    });

    if (!accepted) return;

    const response = await peopleClient.bulkSoftDelete(organizationId, [...selectedActiveIds]);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success('Selected people deleted.');
    await loadPeople('active');
    await loadPeople('deleted');
  }, [canManage, confirm, selectedActiveIds, organizationId, loadPeople]);

  const handleBulkHardDelete = useCallback(async () => {
    if (!canManage || selectedDeletedIds.size === 0) return;

    const accepted = await confirm.confirm({
      title: 'Hard delete selected people',
      description: `Permanently delete ${selectedDeletedIds.size} selected people?`,
      confirmLabel: 'Hard delete selected',
      variant: 'destructive',
    });

    if (!accepted) return;

    const response = await peopleClient.bulkHardDelete(organizationId, [...selectedDeletedIds]);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success('Selected people permanently removed.');
    await loadPeople('deleted');
  }, [canManage, confirm, selectedDeletedIds, organizationId, loadPeople]);

  const togglePersonEventLink = useCallback(
    async (event: PersonEventLinkResponse, linked: boolean) => {
      if (!manageEventsPerson || !canManage) return;

      const response = linked
        ? await peopleClient.unlinkPersonFromEvent(manageEventsPerson.id, event.id)
        : await peopleClient.linkPersonToEvent(manageEventsPerson.id, event.id);

      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      setPersonEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, linked: !linked } : item)));
      toast.success(linked ? 'Unlinked from event.' : 'Linked to event.');
      await loadPeople('active');
    },
    [manageEventsPerson, canManage, loadPeople],
  );

  const stopFaceCamera = useCallback(() => {
    const stream = faceCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      faceCameraStreamRef.current = null;
    }
    setIsFaceCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopFaceCamera();
    };
  }, [stopFaceCamera]);

  const openFaceCamera = useCallback(async () => {
    try {
      stopFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      faceCameraStreamRef.current = stream;
      setIsFaceCameraOpen(true);
      setFaceImageUrl('');

    } catch {
      toast.error('Could not access webcam. Check browser permissions.');
    }
  }, [stopFaceCamera]);

  useEffect(() => {
    if (!isFaceCameraOpen || !faceVideoRef.current || !faceCameraStreamRef.current) {
      return;
    }

    const video = faceVideoRef.current;
    video.srcObject = faceCameraStreamRef.current;
    void video.play().catch(() => null);
  }, [isFaceCameraOpen]);

  const captureFacePhoto = useCallback(() => {
    const video = faceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Unable to capture photo from camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImageDataUrl(captured);
    setFaceImageUrl('');
    stopFaceCamera();
  }, [stopFaceCamera]);

  const handleSaveFace = useCallback(async () => {
    if (!manageFacePerson) return;

    const normalizedImageUrl = faceImageUrl.trim();
    const normalizedImageDataUrl = faceImageDataUrl.trim();

    if (!normalizedImageUrl && !normalizedImageDataUrl) {
      toast.error('Provide an image URL or capture a webcam photo.');
      return;
    }

    setIsSavingFace(true);
    try {
      if (manageFacePerson.faceId) {
        const response = await participantsClient.replaceFaceImage(manageFacePerson.faceId, {
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          isActive: true,
        });

        if (!response.success) throw new Error(response.error.message);
      } else {
        const response = await participantsClient.registerFace({
          personId: manageFacePerson.id,
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
        });

        if (!response.success) throw new Error(response.error.message);
      }

      toast.success(manageFacePerson.faceId ? 'Face image updated.' : 'Face registered.');
      setManageFacePerson(null);
      setFaceImageUrl('');
      setFaceImageDataUrl('');
      stopFaceCamera();
      await loadPeople('active');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save face image.';
      toast.error(message);
    } finally {
      setIsSavingFace(false);
    }
  }, [manageFacePerson, faceImageUrl, faceImageDataUrl, stopFaceCamera, loadPeople]);

  if (isLoadingPage || !isAuthenticated || !canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Users className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">People</h1>
            <p className="text-muted-foreground text-sm">
              Manage people for {activeOrganization?.name ?? 'the selected organization'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {canManage && (
            <Button
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Person
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setActivePage(1);
            setDeletedPage(1);
          }}
          placeholder="Search by name, email, document or phone"
          className="pl-9"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as ActiveTab);
        }}
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {selectedActiveIds.size > 0 && canManage && (
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-2">
              <span className="text-muted-foreground text-sm">{selectedActiveIds.size} selected</span>
              <Button size="sm" variant="destructive" onClick={handleBulkSoftDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete selected
              </Button>
            </div>
          )}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allActiveSelected}
                      onChange={() => {
                        if (allActiveSelected) {
                          setSelectedActiveIds(new Set());
                        } else {
                          setSelectedActiveIds(new Set(activePeople.items.map((person) => person.id)));
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Face</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : activePeople.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      No people found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activePeople.items.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedActiveIds.has(person.id)}
                          onChange={() => {
                            setSelectedActiveIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(person.id)) next.delete(person.id);
                              else next.add(person.id);
                              return next;
                            });
                          }}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.document ?? '—'}</TableCell>
                      <TableCell>{person.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{person.eventsCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            person.faceId ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-400/10 text-gray-500'
                          }
                        >
                          {person.faceId ? 'With image' : 'No image'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {canManage && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openEditModal(person)}>
                              <Edit className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setManageEventsPerson(person);
                                loadPersonEvents(person.id);
                              }}
                            >
                              Events
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setManageFacePerson(person);
                                setFaceImageUrl('');
                                setFaceImageDataUrl('');
                              }}
                            >
                              <ScanFace className="mr-1 h-3.5 w-3.5" />
                              Face
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleSoftDelete(person)}>
                              Delete
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={activePeople.page}
            totalPages={activePeople.totalPages}
            total={activePeople.total}
            onPageChange={setActivePage}
          />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-3">
          {selectedDeletedIds.size > 0 && canManage && (
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-2">
              <span className="text-muted-foreground text-sm">{selectedDeletedIds.size} selected</span>
              <Button size="sm" variant="destructive" onClick={handleBulkHardDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hard delete selected
              </Button>
            </div>
          )}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allDeletedSelected}
                      onChange={() => {
                        if (allDeletedSelected) {
                          setSelectedDeletedIds(new Set());
                        } else {
                          setSelectedDeletedIds(new Set(deletedPeople.items.map((person) => person.id)));
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : deletedPeople.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      No deleted people.
                    </TableCell>
                  </TableRow>
                ) : (
                  deletedPeople.items.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedDeletedIds.has(person.id)}
                          onChange={() => {
                            setSelectedDeletedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(person.id)) next.delete(person.id);
                              else next.add(person.id);
                              return next;
                            });
                          }}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.deletedAt ? new Date(person.deletedAt).toLocaleString() : '—'}</TableCell>
                      <TableCell>
                        {canManage && (
                          <Button variant="destructive" size="sm" onClick={() => handleHardDelete(person)}>
                            Hard delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={deletedPeople.page}
            totalPages={deletedPeople.totalPages}
            total={deletedPeople.total}
            onPageChange={setDeletedPage}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Person</DialogTitle>
            <DialogDescription>Add a person to this organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Document</Label>
              <Input value={formDocument} onChange={(event) => setFormDocument(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select
                value={formDocumentType}
                onValueChange={(value) => setFormDocumentType(value as DocumentType | '')}
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
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={formPhone} onChange={(event) => setFormPhone(event.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Face Image URL (optional)</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={createFaceImageUrl}
                onChange={(event) => {
                  setCreateFaceImageUrl(event.target.value);
                  if (event.target.value.trim()) {
                    setCreateFaceImageDataUrl('');
                    stopCreateFaceCamera();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Face Webcam (optional)</Label>
              <div className="flex gap-2">
                {!isCreateFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openCreateFaceCamera}>
                    Open camera
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureCreateFacePhoto}>
                      Capture photo
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopCreateFaceCamera}>
                      Close camera
                    </Button>
                  </>
                )}
              </div>
              {isCreateFaceCameraOpen && (
                <video ref={createFaceVideoRef} className="w-full rounded-md border" autoPlay playsInline muted />
              )}
            </div>

            {(createFaceImageDataUrl || createFaceImageUrl.trim()) && (
              <div className="space-y-2">
                <Label>Face Preview</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createFaceImageDataUrl || createFaceImageUrl.trim()}
                  alt="Person face preview"
                  className="h-40 w-full rounded-md border object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmittingForm || !formName || !formEmail} onClick={() => handleCreateOrUpdate(false)}>
              {isSubmittingForm ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editPerson}
        onOpenChange={(open) => {
          if (!open) {
            setEditPerson(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
            <DialogDescription>Update person details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Document</Label>
              <Input value={formDocument} onChange={(event) => setFormDocument(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select
                value={formDocumentType}
                onValueChange={(value) => setFormDocumentType(value as DocumentType | '')}
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
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={formPhone} onChange={(event) => setFormPhone(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditPerson(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button disabled={isSubmittingForm || !formName || !formEmail} onClick={() => handleCreateOrUpdate(true)}>
              {isSubmittingForm ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageEventsPerson} onOpenChange={(open) => !open && setManageEventsPerson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Events</DialogTitle>
            <DialogDescription>
              {manageEventsPerson ? `Link or unlink events for ${manageEventsPerson.name}.` : 'Manage event links.'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPersonEvents ? (
            <p className="text-muted-foreground text-sm">Loading events...</p>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {personEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(event.startsAt).toLocaleString()} - {new Date(event.endsAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.status}</Badge>
                    <Switch checked={event.linked} onCheckedChange={() => togglePersonEventLink(event, event.linked)} />
                  </div>
                </div>
              ))}

              {personEvents.length === 0 && <p className="text-muted-foreground text-sm">No events found.</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageEventsPerson(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!manageFacePerson}
        onOpenChange={(open) => {
          if (!open) {
            setManageFacePerson(null);
            setFaceImageUrl('');
            setFaceImageDataUrl('');
            stopFaceCamera();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{manageFacePerson?.faceId ? 'Update Face Image' : 'Register Face'}</DialogTitle>
            <DialogDescription>
              Provide an image URL or capture from webcam. Embedding and hash are generated internally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="person-face-url">Image URL</Label>
              <Input
                id="person-face-url"
                type="url"
                placeholder="https://..."
                value={faceImageUrl}
                onChange={(event) => {
                  setFaceImageUrl(event.target.value);
                  if (event.target.value.trim()) {
                    setFaceImageDataUrl('');
                    stopFaceCamera();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Webcam</Label>
              <div className="flex gap-2">
                {!isFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openFaceCamera}>
                    Open camera
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureFacePhoto}>
                      Capture photo
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopFaceCamera}>
                      Close camera
                    </Button>
                  </>
                )}
              </div>

              {isFaceCameraOpen && (
                <video ref={faceVideoRef} className="w-full rounded-md border" autoPlay playsInline muted />
              )}
            </div>

            {(faceImageDataUrl || faceImageUrl.trim()) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faceImageDataUrl || faceImageUrl.trim()}
                  alt="Face preview"
                  className="h-48 w-full rounded-md border object-cover"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageFacePerson(null);
                setFaceImageUrl('');
                setFaceImageDataUrl('');
                stopFaceCamera();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFace} disabled={isSavingFace}>
              {isSavingFace ? 'Saving...' : manageFacePerson?.faceId ? 'Update Face' : 'Register Face'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
