'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { eventCheckinsClient, eventsClient, participantsClient } from '@/core/application/client-services';
import type {
  EventAIConfigResponse,
  EventCheckInDetailResponse,
  EventParticipantDetailResponse,
  EventTotemAvailableResponse,
  EventTotemSubscriptionResponse,
  PaginatedEventParticipantsResponse,
  PrintConfigSummaryResponse,
} from '@/core/application/client-services/events/events-client.service';
import { extractFaceEmbedding } from '@/core/application/client-services/totem/face-embedding.client';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import type { EventResponse } from '@/core/communication/responses/event';
import { useI18n } from '@/i18n';

function formatDateTime(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatDate(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
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
  const { locale, t } = useI18n();

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
  const [participantFaceImageUrl, setParticipantFaceImageUrl] = useState('');
  const [participantFaceImageDataUrl, setParticipantFaceImageDataUrl] = useState('');
  const [isCreateFaceCameraOpen, setIsCreateFaceCameraOpen] = useState(false);
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);
  const createFaceVideoRef = useRef<HTMLVideoElement | null>(null);
  const createFaceCameraStreamRef = useRef<MediaStream | null>(null);
  const [totems, setTotems] = useState<EventTotemSubscriptionResponse[]>([]);
  const [availableTotems, setAvailableTotems] = useState<EventTotemAvailableResponse[]>([]);
  const [checkIns, setCheckIns] = useState<EventCheckInDetailResponse[]>([]);
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false);
  const [manualParticipantId, setManualParticipantId] = useState('');
  const [isSubmittingManualCheckIn, setIsSubmittingManualCheckIn] = useState(false);
  const [invalidatingCheckInId, setInvalidatingCheckInId] = useState<string | null>(null);
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

  const [faceImageUrl, setFaceImageUrl] = useState('');
  const [faceImageDataUrl, setFaceImageDataUrl] = useState('');
  const [isFaceCameraOpen, setIsFaceCameraOpen] = useState(false);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceCameraStreamRef = useRef<MediaStream | null>(null);

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
  const [aiConfig, setAiConfig] = useState<EventAIConfigResponse>({
    confidenceThreshold: 0.75,
    detectionIntervalMs: 500,
    maxFaces: 1,
    livenessDetection: false,
    minFaceSize: 80,
    recommendedEmbeddingModel: 'InsightFace Buffalo_L (ArcFace, 512d)',
    recommendedDetectorModel: 'SCRFD 10G (2026 production baseline)',
  });
  const [isSavingAIConfig, setIsSavingAIConfig] = useState(false);

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

  const manualCheckInParticipants = useMemo(
    () => participants.filter((participant) => !participant.hasCheckIn),
    [participants],
  );

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
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadEventError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, t('pages.eventDetail.loadEventError')]);

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
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadParticipantsError');
      toast.error(message);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [eventId, participantsPage, participantsSearch, t('pages.eventDetail.loadParticipantsError')]);

  function resetCreateParticipantForm() {
    setParticipantName('');
    setParticipantEmail('');
    setParticipantDocument('');
    setParticipantDocumentType('');
    setParticipantPhone('');
    setParticipantCompany('');
    setParticipantJobTitle('');
    setParticipantFaceImageUrl('');
    setParticipantFaceImageDataUrl('');
    stopCreateFaceCamera();
  }

  const stopCreateFaceCamera = useCallback(() => {
    const stream = createFaceCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      createFaceCameraStreamRef.current = null;
    }

    setIsCreateFaceCameraOpen(false);
  }, []);

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

  async function openCreateFaceCamera() {
    try {
      stopCreateFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      createFaceCameraStreamRef.current = stream;
      setIsCreateFaceCameraOpen(true);
      setParticipantFaceImageUrl('');
    } catch {
      toast.error(t('pages.eventDetail.webcamAccessError'));
    }
  }

  function captureCreateFacePhoto() {
    const video = createFaceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error(t('pages.eventDetail.cameraNotReady'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error(t('pages.eventDetail.capturePhotoError'));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setParticipantFaceImageDataUrl(captured);
    setParticipantFaceImageUrl('');
    stopCreateFaceCamera();
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

      const normalizedFaceImageUrl = participantFaceImageUrl.trim();
      const normalizedFaceImageDataUrl = participantFaceImageDataUrl.trim();
      if (normalizedFaceImageUrl || normalizedFaceImageDataUrl) {
        const embedding = await extractFaceEmbedding({
          imageDataUrl: normalizedFaceImageDataUrl || undefined,
          imageUrl: normalizedFaceImageUrl || undefined,
        });

        if (!embedding) {
          throw new Error(t('pages.eventDetail.embeddingError'));
        }

        const faceResponse = await participantsClient.registerFace({
          personId: response.data.personId,
          imageUrl: normalizedFaceImageUrl || undefined,
          imageDataUrl: normalizedFaceImageDataUrl || undefined,
          embedding: embedding ?? undefined,
          embeddingModel: embedding ? 'Human v3.3.6 face description (SFace/ArcFace compatible)' : undefined,
        });

        if (!faceResponse.success) {
          throw new Error(faceResponse.error.message);
        }
      }

      toast.success(t('pages.eventDetail.participantAddedSuccess'));
      setCreateParticipantOpen(false);
      resetCreateParticipantForm();
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.addParticipantError');
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
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadTotemsError');
      toast.error(message);
    } finally {
      setIsLoadingTotems(false);
    }
  }, [eventId, t('pages.eventDetail.loadTotemsError')]);

  const loadCheckIns = useCallback(async () => {
    setIsLoadingCheckIns(true);
    try {
      const response = await eventsClient.listEventCheckIns(eventId);
      if (!response.success) throw new Error(response.error.message);
      setCheckIns(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadCheckinsError');
      toast.error(message);
    } finally {
      setIsLoadingCheckIns(false);
    }
  }, [eventId, t('pages.eventDetail.loadCheckinsError')]);

  async function handleManualCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualParticipantId) {
      toast.error(t('pages.eventDetail.selectParticipantError'));
      return;
    }

    setIsSubmittingManualCheckIn(true);
    try {
      const response = await eventCheckinsClient.registerAppCheckIn(eventId, {
        eventParticipantId: manualParticipantId,
        method: 'MANUAL',
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      toast.success(t('pages.eventDetail.manualCheckinSuccess'));
      setManualCheckInOpen(false);
      setManualParticipantId('');
      await Promise.all([loadCheckIns(), loadParticipants()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.manualCheckinError');
      toast.error(message);
    } finally {
      setIsSubmittingManualCheckIn(false);
    }
  }

  async function handleInvalidateCheckIn(checkInId: string, participantName: string) {
    const accepted = await confirm.confirm({
      title: t('pages.eventDetail.invalidateCheckinTitle'),
      description: t('pages.eventDetail.invalidateCheckinDescription').replace('{name}', participantName),
      confirmLabel: t('pages.eventDetail.invalidateCheckinConfirm'),
      variant: 'destructive',
    });

    if (!accepted) return;

    setInvalidatingCheckInId(checkInId);
    try {
      const response = await eventCheckinsClient.invalidateCheckIn(eventId, checkInId);
      if (!response.success) throw new Error(response.error.message);
      toast.success(t('pages.eventDetail.invalidateCheckinSuccess'));
      await Promise.all([loadCheckIns(), loadParticipants()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.invalidateCheckinError');
      toast.error(message);
    } finally {
      setInvalidatingCheckInId(null);
    }
  }

  const loadPrintConfigs = useCallback(async () => {
    const response = await eventsClient.listPrintConfigs();
    if (response.success) {
      setPrintConfigs(response.data);
    }
  }, []);

  const loadAIConfig = useCallback(async () => {
    const response = await eventsClient.getEventAIConfig(eventId);
    if (response.success) {
      setAiConfig(response.data);
    }
  }, [eventId]);

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
      loadAIConfig();
    }
  }, [isAuthenticated, canView, loadEvent, loadParticipants, loadTotems, loadCheckIns, loadPrintConfigs, loadAIConfig]);

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

  useEffect(() => {
    if (!isFaceCameraOpen || !faceVideoRef.current || !faceCameraStreamRef.current) {
      return;
    }

    const video = faceVideoRef.current;
    video.srcObject = faceCameraStreamRef.current;
    void video.play().catch(() => null);
  }, [isFaceCameraOpen]);

  async function openFaceCamera() {
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
      toast.error(t('pages.eventDetail.webcamAccessError'));
    }
  }

  function captureFacePhoto() {
    const video = faceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error(t('pages.eventDetail.cameraNotReady'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error(t('pages.eventDetail.capturePhotoError'));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImageDataUrl(captured);
    setFaceImageUrl('');
    stopFaceCamera();
  }

  async function handleAssignTotem(e: React.FormEvent) {
    e.preventDefault();

    if (!assignTotemId || !assignLocation.trim() || !assignStartsAt || !assignEndsAt) return;

    const startDate = new Date(assignStartsAt);
    const endDate = new Date(assignEndsAt);

    if (startDate >= endDate) {
      toast.error(t('pages.eventDetail.dateRangeError'));
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
      toast.success(t('pages.eventDetail.assignTotemSuccess'));
      setAssignTotemOpen(false);
      setAssignTotemId('');
      setAssignLocation('');
      setAssignStartsAt('');
      setAssignEndsAt('');
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.assignTotemError');
      toast.error(message);
    } finally {
      setIsAssigningTotem(false);
    }
  }

  async function handleRemoveTotem(sub: EventTotemSubscriptionResponse) {
    const accepted = await confirm.confirm({
      title: t('pages.eventDetail.removeTotemTitle'),
      description: t('pages.eventDetail.removeTotemDescription').replace('{name}', sub.totemName),
      confirmLabel: t('pages.eventDetail.removeTotemConfirm'),
      variant: 'destructive',
    });

    if (!accepted) return;

    try {
      await eventsClient.removeTotemFromEvent(eventId, sub.id);
      toast.success(t('pages.eventDetail.removeTotemSuccess'));
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.removeTotemError');
      toast.error(message);
    }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!changeLocationSub) return;

    setIsUpdatingLocation(true);
    try {
      await eventsClient.updateTotemLocation(eventId, changeLocationSub.id, { locationName: newLocation.trim() });
      toast.success(t('pages.eventDetail.updateLocationSuccess'));
      setChangeLocationSub(null);
      loadTotems();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.updateLocationError');
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
      toast.success(t('pages.eventDetail.participantUpdatedSuccess'));
      setEditParticipant(null);
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.updateParticipantError');
      toast.error(message);
    } finally {
      setIsSavingParticipant(false);
    }
  }

  async function handleDeleteParticipant(participant: EventParticipantDetailResponse) {
    const accepted = await confirm.confirm({
      title: t('pages.eventDetail.deleteParticipantTitle'),
      description: t('pages.eventDetail.deleteParticipantDescription').replace('{name}', participant.name),
      confirmLabel: t('pages.eventDetail.deleteParticipantConfirm'),
      variant: 'destructive',
    });

    if (!accepted) return;

    try {
      await participantsClient.deleteParticipant(participant.id);
      toast.success(t('pages.eventDetail.deleteParticipantSuccess'));
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.deleteParticipantError');
      toast.error(message);
    }
  }

  async function handleRegisterFace(e: React.FormEvent) {
    e.preventDefault();
    if (!registerFaceParticipant) return;

    const normalizedImageUrl = faceImageUrl.trim();
    const normalizedImageDataUrl = faceImageDataUrl.trim();

    if (!normalizedImageUrl && !normalizedImageDataUrl) {
      toast.error(t('pages.eventDetail.provideImageSource'));
      return;
    }

    setIsRegisteringFace(true);
    try {
      const embedding = await extractFaceEmbedding({
        imageDataUrl: normalizedImageDataUrl || undefined,
        imageUrl: normalizedImageUrl || undefined,
      });

      if (!embedding) {
        throw new Error(t('pages.eventDetail.embeddingError'));
      }

      if (registerFaceParticipant.faceId) {
        await participantsClient.replaceFaceImage(registerFaceParticipant.faceId, {
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding: embedding ?? undefined,
          embeddingModel: embedding ? 'Human v3.3.6 face description (SFace/ArcFace compatible)' : undefined,
          isActive: true,
        });
      } else {
        await participantsClient.registerFace({
          personId: registerFaceParticipant.personId,
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding: embedding ?? undefined,
          embeddingModel: embedding ? 'Human v3.3.6 face description (SFace/ArcFace compatible)' : undefined,
        });
      }

      toast.success(
        registerFaceParticipant.faceId ? t('pages.eventDetail.faceUpdated') : t('pages.eventDetail.faceRegistered'),
      );
      setRegisterFaceParticipant(null);
      setFaceImageUrl('');
      setFaceImageDataUrl('');
      stopFaceCamera();
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.registerFaceError');
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
      toast.error(t('pages.eventDetail.dateRangeError'));
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
          toast.error(t('pages.eventDetail.invalidStatusTransition'));
          return;
        }
      }

      toast.success(t('pages.eventDetail.eventUpdated'));
      loadEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.updateEventError');
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
      toast.success(t('pages.eventDetail.printConfigCreated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.printConfigError');
      toast.error(message);
    } finally {
      setIsCreatingPrintConfig(false);
    }
  }

  async function handleSaveAIConfig(e: React.FormEvent) {
    e.preventDefault();

    setIsSavingAIConfig(true);
    try {
      const response = await eventsClient.updateEventAIConfig(eventId, {
        confidenceThreshold: aiConfig.confidenceThreshold,
        detectionIntervalMs: aiConfig.detectionIntervalMs,
        maxFaces: aiConfig.maxFaces,
        livenessDetection: aiConfig.livenessDetection,
        minFaceSize: aiConfig.minFaceSize,
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      setAiConfig(response.data);
      toast.success(t('pages.eventDetail.aiUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.aiUpdateError');
      toast.error(message);
    } finally {
      setIsSavingAIConfig(false);
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
          <TabsTrigger value="overview">{t('pages.eventDetail.tabOverview')}</TabsTrigger>
          <TabsTrigger value="participants">{t('pages.eventDetail.tabParticipants')}</TabsTrigger>
          <TabsTrigger value="totems">{t('pages.eventDetail.tabTotems')}</TabsTrigger>
          <TabsTrigger value="checkins">{t('pages.eventDetail.tabCheckins')}</TabsTrigger>
          <TabsTrigger value="ai">{t('pages.eventDetail.tabAi')}</TabsTrigger>
          <TabsTrigger value="settings">{t('pages.eventDetail.tabSettings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title={t('pages.eventDetail.statParticipants')}
              value={stats.totalParticipants}
              icon={<User className="h-4 w-4" />}
            />
            <StatCard
              title={t('pages.eventDetail.statCheckins')}
              value={stats.checkedIn}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              title={t('pages.eventDetail.statTotems')}
              value={stats.totalTotems}
              icon={<MonitorSmartphone className="h-4 w-4" />}
            />
            <StatCard
              title={t('pages.eventDetail.statRate')}
              value={stats.checkInRate}
              icon={<ScanFace className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('pages.eventDetail.eventDetailsTitle')}</CardTitle>
              <CardDescription>{t('pages.eventDetail.eventDetailsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label={t('pages.eventDetail.startDate')}
                value={formatDateTime(event.startsAt, locale)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label={t('pages.eventDetail.endDate')}
                value={formatDateTime(event.endsAt, locale)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label={t('pages.eventDetail.timezone')}
                value={event.timezone}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label={t('pages.eventDetail.location')}
                value={event.address ?? '—'}
                icon={<MapPin className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{t('pages.eventDetail.participantsTitle')}</CardTitle>
                  <CardDescription>
                    {t('pages.eventDetail.participantsDescription').replace('{count}', String(participantsMeta.total))}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateParticipantOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pages.eventDetail.addParticipant')}
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
                  placeholder={t('pages.eventDetail.searchParticipants')}
                  className="pl-9"
                />
              </div>

              {isLoadingParticipants ? (
                <Skeleton className="h-40" />
              ) : participants.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  {t('pages.eventDetail.noParticipants')}
                </p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('pages.eventDetail.participant')}</TableHead>
                        <TableHead>{t('pages.eventDetail.emailRequired').replace(' *', '')}</TableHead>
                        <TableHead>{t('pages.eventDetail.company')}</TableHead>
                        <TableHead>{t('pages.eventDetail.jobTitle')}</TableHead>
                        <TableHead>{t('pages.eventDetail.registeredAt')}</TableHead>
                        <TableHead>{t('pages.eventDetail.face')}</TableHead>
                        <TableHead>{t('pages.eventDetail.checkinStatus')}</TableHead>
                        <TableHead className="w-24">{t('pages.eventDetail.actions')}</TableHead>
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
                            {formatDate(participant.registeredAt, locale)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                participant.faceId
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-gray-400/10 text-gray-500'
                              }
                            >
                              {participant.faceId ? t('pages.eventDetail.withImage') : t('pages.eventDetail.noImage')}
                            </Badge>
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
                              {participant.hasCheckIn
                                ? t('pages.eventDetail.checkedIn')
                                : t('pages.eventDetail.pending')}
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
                <p className="text-muted-foreground text-sm">
                  {t('pages.eventDetail.results').replace('{count}', String(participantsMeta.total))}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={participantsMeta.page <= 1}
                    onClick={() => setParticipantsPage((current) => Math.max(current - 1, 1))}
                  >
                    {t('pages.eventDetail.previous')}
                  </Button>
                  <span className="text-sm">
                    {t('pages.eventDetail.pageOf')
                      .replace('{page}', String(participantsMeta.page))
                      .replace('{total}', String(participantsMeta.totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={participantsMeta.page >= participantsMeta.totalPages}
                    onClick={() => setParticipantsPage((current) => current + 1)}
                  >
                    {t('pages.eventDetail.next')}
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
                  <CardTitle>{t('pages.eventDetail.totemsTitle')}</CardTitle>
                  <CardDescription>
                    {t('pages.eventDetail.totemsDescription').replace('{count}', String(totems.length))}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setAssignTotemOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pages.eventDetail.assignTotem')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTotems ? (
                <Skeleton className="h-40" />
              ) : totems.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">{t('pages.eventDetail.noTotems')}</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('pages.eventDetail.totemName')}</TableHead>
                        <TableHead>{t('pages.eventDetail.location')}</TableHead>
                        <TableHead>{t('pages.eventDetail.status')}</TableHead>
                        <TableHead>{t('pages.eventDetail.lastHeartbeat')}</TableHead>
                        <TableHead className="w-24">{t('pages.eventDetail.actions')}</TableHead>
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
                            {totem.lastHeartbeat ? formatDateTime(totem.lastHeartbeat, locale) : '—'}
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{t('pages.eventDetail.checkinsTitle')}</CardTitle>
                  <CardDescription>
                    {t('pages.eventDetail.checkinsDescription').replace('{count}', String(checkIns.length))}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setManualCheckInOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pages.eventDetail.manualAppCheckin')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCheckIns ? (
                <Skeleton className="h-40" />
              ) : checkIns.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">{t('pages.eventDetail.noCheckins')}</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('pages.eventDetail.participant')}</TableHead>
                        <TableHead>{t('pages.eventDetail.method')}</TableHead>
                        <TableHead>{t('pages.eventDetail.confidence')}</TableHead>
                        <TableHead>{t('pages.eventDetail.totemLocation')}</TableHead>
                        <TableHead>{t('pages.eventDetail.time')}</TableHead>
                        <TableHead>{t('pages.eventDetail.actions')}</TableHead>
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
                          <TableCell className="text-muted-foreground">{checkIn.totemLocation || 'APP'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(checkIn.checkedInAt, locale)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={invalidatingCheckInId === checkIn.id}
                              onClick={() => handleInvalidateCheckIn(checkIn.id, checkIn.participantName)}
                            >
                              {invalidatingCheckInId === checkIn.id
                                ? t('pages.eventDetail.invalidating')
                                : t('pages.eventDetail.invalidate')}
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.eventDetail.settingsTitle')}</CardTitle>
              <CardDescription>{t('pages.eventDetail.settingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">{t('pages.eventDetail.nameRequired')}</Label>
                    <Input
                      id="settings-name"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-status">{t('pages.eventDetail.statusSelect')}</Label>
                    <Select
                      value={settingsStatus}
                      onValueChange={(value) => setSettingsStatus(value as EventResponse['status'])}
                    >
                      <SelectTrigger id="settings-status">
                        <SelectValue placeholder={t('pages.eventDetail.selectStatus')} />
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
                  <Label htmlFor="settings-description">{t('pages.eventDetail.description')}</Label>
                  <Textarea
                    id="settings-description"
                    value={settingsDescription}
                    onChange={(e) => setSettingsDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-timezone">{t('pages.eventDetail.timezone')} *</Label>
                    <Input
                      id="settings-timezone"
                      value={settingsTimezone}
                      onChange={(e) => setSettingsTimezone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-address">{t('pages.eventDetail.address')}</Label>
                    <Input
                      id="settings-address"
                      value={settingsAddress}
                      onChange={(e) => setSettingsAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-start">{t('pages.eventDetail.startDate')} *</Label>
                    <Input
                      id="settings-start"
                      type="datetime-local"
                      value={settingsStartsAt}
                      onChange={(e) => setSettingsStartsAt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-end">{t('pages.eventDetail.endDate')} *</Label>
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
                  <Label>{t('pages.eventDetail.printConfig')}</Label>
                  <div className="flex gap-2">
                    <Select value={settingsPrintConfigId} onValueChange={setSettingsPrintConfigId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.eventDetail.selectPrintConfig')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_PRINT_CONFIG}>{t('pages.eventDetail.none')}</SelectItem>
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
                      {isCreatingPrintConfig ? t('pages.eventDetail.creating') : t('pages.eventDetail.createNew')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveSettings')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.eventDetail.aiTitle')}</CardTitle>
              <CardDescription>{t('pages.eventDetail.aiDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAIConfig} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-threshold">{t('pages.eventDetail.confidenceThreshold')}</Label>
                    <Input
                      id="ai-threshold"
                      type="number"
                      min={0.3}
                      max={0.99}
                      step={0.01}
                      value={aiConfig.confidenceThreshold}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          confidenceThreshold: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-interval">{t('pages.eventDetail.detectionInterval')}</Label>
                    <Input
                      id="ai-interval"
                      type="number"
                      min={100}
                      max={5000}
                      step={50}
                      value={aiConfig.detectionIntervalMs}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          detectionIntervalMs: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-max-faces">{t('pages.eventDetail.maxFaces')}</Label>
                    <Input
                      id="ai-max-faces"
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={aiConfig.maxFaces}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          maxFaces: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-min-face-size">{t('pages.eventDetail.minFaceSize')}</Label>
                    <Input
                      id="ai-min-face-size"
                      type="number"
                      min={32}
                      max={600}
                      step={1}
                      value={aiConfig.minFaceSize}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          minFaceSize: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    id="ai-liveness"
                    type="checkbox"
                    checked={aiConfig.livenessDetection}
                    onChange={(e) =>
                      setAiConfig((current) => ({
                        ...current,
                        livenessDetection: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="ai-liveness">{t('pages.eventDetail.enableLiveness')}</Label>
                </div>

                <div className="bg-muted/30 rounded-lg border p-3 text-sm">
                  <p className="font-medium">{t('pages.eventDetail.recommendedStack')}</p>
                  <p className="text-muted-foreground mt-1">
                    {t('pages.eventDetail.detector')}: {aiConfig.recommendedDetectorModel}
                  </p>
                  <p className="text-muted-foreground">
                    {t('pages.eventDetail.embedding')}: {aiConfig.recommendedEmbeddingModel}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingAIConfig}>
                    {isSavingAIConfig ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveAiSettings')}
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
            <DialogTitle>{t('pages.eventDetail.assignTotemTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.assignTotemDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTotem} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pages.eventDetail.totem')}</Label>
              <Select value={assignTotemId} onValueChange={setAssignTotemId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.eventDetail.selectTotem')} />
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
              <Label htmlFor="assign-location">{t('pages.eventDetail.locationRequired')}</Label>
              <Input
                id="assign-location"
                value={assignLocation}
                onChange={(e) => setAssignLocation(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assign-start">{t('pages.eventDetail.startDate')} *</Label>
                <Input
                  id="assign-start"
                  type="datetime-local"
                  value={assignStartsAt}
                  onChange={(e) => setAssignStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-end">{t('pages.eventDetail.endDate')} *</Label>
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
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button type="submit" disabled={isAssigningTotem}>
                {isAssigningTotem ? t('pages.eventDetail.assigning') : t('pages.eventDetail.assignTotem')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={manualCheckInOpen}
        onOpenChange={(open) => {
          setManualCheckInOpen(open);
          if (!open) {
            setManualParticipantId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.eventDetail.manualCheckinTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.manualCheckinDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualCheckInSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pages.eventDetail.participant')} *</Label>
              <Select value={manualParticipantId} onValueChange={setManualParticipantId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.eventDetail.selectParticipant')} />
                </SelectTrigger>
                <SelectContent>
                  {manualCheckInParticipants.length > 0
                    ? manualCheckInParticipants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.name} ({participant.email})
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
              {manualCheckInParticipants.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('pages.eventDetail.allHaveCheckin')}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualCheckInOpen(false)}>
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingManualCheckIn || !manualParticipantId || manualCheckInParticipants.length === 0}
              >
                {isSubmittingManualCheckIn ? t('pages.eventDetail.saving') : t('pages.eventDetail.createCheckin')}
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
            <DialogTitle>{t('pages.eventDetail.addParticipantTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.addParticipantDescription')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateParticipant} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-name">{t('pages.eventDetail.nameRequired')}</Label>
                <Input
                  id="participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant-email">{t('pages.eventDetail.emailRequired')}</Label>
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
                <Label htmlFor="participant-document">{t('pages.eventDetail.document')}</Label>
                <Input
                  id="participant-document"
                  value={participantDocument}
                  onChange={(e) => setParticipantDocument(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('pages.eventDetail.documentType')}</Label>
                <Select
                  value={participantDocumentType}
                  onValueChange={(value) =>
                    setParticipantDocumentType(value as 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER' | '')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pages.eventDetail.selectDocumentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSPORT">{t('pages.eventDetail.passport')}</SelectItem>
                    <SelectItem value="ID_CARD">{t('pages.eventDetail.idCard')}</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">{t('pages.eventDetail.driverLicense')}</SelectItem>
                    <SelectItem value="OTHER">{t('pages.eventDetail.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-phone">{t('pages.eventDetail.phone')}</Label>
                <Input
                  id="participant-phone"
                  value={participantPhone}
                  onChange={(e) => setParticipantPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant-company">{t('pages.eventDetail.company')}</Label>
                <Input
                  id="participant-company"
                  value={participantCompany}
                  onChange={(e) => setParticipantCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-job-title">{t('pages.eventDetail.jobTitle')}</Label>
              <Input
                id="participant-job-title"
                value={participantJobTitle}
                onChange={(e) => setParticipantJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-face-url">{t('pages.eventDetail.faceImageUrlOptional')}</Label>
              <Input
                id="participant-face-url"
                type="url"
                value={participantFaceImageUrl}
                onChange={(e) => {
                  setParticipantFaceImageUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setParticipantFaceImageDataUrl('');
                    stopCreateFaceCamera();
                  }
                }}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t('pages.eventDetail.faceWebcamOptional')}</Label>
              <div className="flex gap-2">
                {!isCreateFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openCreateFaceCamera}>
                    {t('pages.eventDetail.openCamera')}
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureCreateFacePhoto}>
                      {t('pages.eventDetail.capturePhoto')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopCreateFaceCamera}>
                      {t('pages.eventDetail.closeCamera')}
                    </Button>
                  </>
                )}
              </div>

              {isCreateFaceCameraOpen && (
                <video ref={createFaceVideoRef} className="w-full rounded-md border" autoPlay playsInline muted />
              )}
            </div>

            {(participantFaceImageDataUrl || participantFaceImageUrl.trim()) && (
              <div className="space-y-2">
                <Label>{t('pages.eventDetail.facePreview')}</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={participantFaceImageDataUrl || participantFaceImageUrl.trim()}
                  alt="Participant face preview"
                  className="h-40 w-full rounded-md border object-cover"
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateParticipantOpen(false)}>
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button type="submit" disabled={isCreatingParticipant || !participantName || !participantEmail}>
                {isCreatingParticipant ? t('pages.eventDetail.saving') : t('pages.eventDetail.addParticipantAction')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changeLocationSub} onOpenChange={(open) => !open && setChangeLocationSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.eventDetail.changeLocationTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.changeLocationDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-location">{t('pages.eventDetail.locationRequired')}</Label>
              <Input id="new-location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangeLocationSub(null)}>
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button type="submit" disabled={isUpdatingLocation}>
                {isUpdatingLocation ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveLocation')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editParticipant} onOpenChange={(open) => !open && setEditParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.eventDetail.editParticipantTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.editParticipantDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveParticipant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">{t('pages.eventDetail.company')}</Label>
              <Input id="edit-company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-title">{t('pages.eventDetail.jobTitle')}</Label>
              <Input id="edit-job-title" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditParticipant(null)}>
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button type="submit" disabled={isSavingParticipant}>
                {isSavingParticipant ? t('pages.eventDetail.saving') : t('pages.eventDetail.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewParticipant} onOpenChange={(open) => !open && setViewParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.eventDetail.participantDetailsTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.participantDetailsDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <InfoRow
              label={t('pages.eventDetail.nameRequired').replace(' *', '')}
              value={viewParticipant?.name ?? ''}
            />
            <InfoRow
              label={t('pages.eventDetail.emailRequired').replace(' *', '')}
              value={viewParticipant?.email ?? ''}
            />
            <InfoRow label={t('pages.eventDetail.company')} value={viewParticipant?.company ?? '—'} />
            <InfoRow label={t('pages.eventDetail.jobTitle')} value={viewParticipant?.jobTitle ?? '—'} />
            <InfoRow
              label={t('pages.eventDetail.registeredAt')}
              value={viewParticipant ? formatDateTime(viewParticipant.registeredAt, locale) : ''}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!registerFaceParticipant}
        onOpenChange={(open) => {
          if (!open) {
            setRegisterFaceParticipant(null);
            setFaceImageUrl('');
            setFaceImageDataUrl('');
            stopFaceCamera();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {registerFaceParticipant?.faceId
                ? t('pages.eventDetail.updateFaceTitle')
                : t('pages.eventDetail.registerFaceTitle')}
            </DialogTitle>
            <DialogDescription>{t('pages.eventDetail.registerFaceDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterFace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="face-url">{t('pages.eventDetail.imageUrl')}</Label>
              <Input
                id="face-url"
                type="url"
                value={faceImageUrl}
                onChange={(e) => {
                  setFaceImageUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setFaceImageDataUrl('');
                    stopFaceCamera();
                  }
                }}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t('pages.eventDetail.faceWebcamOptional').replace(' (optional)', '')}</Label>
              <div className="flex gap-2">
                {!isFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openFaceCamera}>
                    {t('pages.eventDetail.openCamera')}
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureFacePhoto}>
                      {t('pages.eventDetail.capturePhoto')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopFaceCamera}>
                      {t('pages.eventDetail.closeCamera')}
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
                <Label>{t('pages.eventDetail.preview')}</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faceImageDataUrl || faceImageUrl.trim()}
                  alt="Face preview"
                  className="h-48 w-full rounded-md border object-cover"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRegisterFaceParticipant(null);
                  setFaceImageUrl('');
                  setFaceImageDataUrl('');
                  stopFaceCamera();
                }}
              >
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button type="submit" disabled={isRegisteringFace}>
                {isRegisteringFace
                  ? t('pages.eventDetail.saving')
                  : registerFaceParticipant?.faceId
                    ? t('pages.eventDetail.updateFaceAction')
                    : t('pages.eventDetail.registerFaceAction')}
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
