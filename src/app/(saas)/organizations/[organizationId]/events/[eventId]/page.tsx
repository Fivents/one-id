'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  MonitorSmartphone,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  ScanFace,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { EventAddressEditor, EventStatusBadge, PrintLayoutEditor } from '@/components/organizations/events';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { LabelPrintConfirmationModal } from '@/components/shared/label-print-confirmation-modal';
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  eventCheckinsClient,
  eventsClient,
  participantsClient,
  peopleClient,
} from '@/core/application/client-services';
import type {
  EventAIConfigResponse,
  EventCheckInDetailResponse,
  EventParticipantDetailResponse,
  EventTotemAvailableResponse,
  EventTotemSubscriptionResponse,
  PaginatedEventParticipantsResponse,
  PrintConfigFullResponse,
} from '@/core/application/client-services/events/events-client.service';
import type {
  PaginatedPeopleResponse,
  PersonSummaryResponse,
} from '@/core/application/client-services/people-client.service';
import { extractFaceEmbedding } from '@/core/application/client-services/totem/face-embedding.client';
import {
  buildDefaultElementsLayout,
  getSilentPrinterAvailability,
  logPrintAttempt,
  printBadgeSilently,
  type PrintParticipantData,
} from '@/core/application/client-services/totem/print.client';
import { useApp, useAuth, usePermissions } from '@/core/application/contexts';
import { PRINT_ITEM_KEYS, type PrintItemKey } from '@/core/communication/requests/print-config';
import type { EventResponse } from '@/core/communication/responses/event';
import { AI_CONFIG_CONSTRAINTS, DEFAULT_AI_CONFIG } from '@/core/domain/constants/ai-config.constants';
import { getValidTransitions, isFinalStatus } from '@/core/domain/constants/event-transitions.constants';
import type { EventAddress } from '@/core/domain/value-objects';
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

const PARTICIPANTS_PAGE_SIZE = 20;

type EditablePrintConfig = Omit<PrintConfigFullResponse, 'id' | 'createdAt' | 'updatedAt'>;

function createDefaultPrintConfig(): EditablePrintConfig {
  return {
    paperWidth: 62,
    paperHeight: 100,
    orientation: 'PORTRAIT',
    marginTop: 5,
    marginRight: 5,
    marginBottom: 5,
    marginLeft: 5,
    showFiventsLogo: true,
    fiventsLogoPosition: 'top',
    fiventsLogoSize: 20,
    showOrgLogo: false,
    orgLogoPosition: 'top',
    orgLogoSize: 25,
    showQrCode: true,
    qrCodePosition: 'bottom',
    qrCodeSize: 28,
    qrCodeContent: 'participant_id',
    showName: true,
    namePosition: 'center',
    nameFontSize: 16,
    nameBold: true,
    showCompany: true,
    companyPosition: 'center',
    companyFontSize: 12,
    showJobTitle: true,
    jobTitlePosition: 'center',
    jobTitleFontSize: 10,
    itemsOrder: [...PRINT_ITEM_KEYS],
    printerDpi: 203,
    printerType: 'thermal',
    printSpeed: 3,
    copies: 1,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial',
    elementsLayout: null,
  };
}

function toEditablePrintConfig(config: PrintConfigFullResponse): EditablePrintConfig {
  return {
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight,
    orientation: config.orientation,
    marginTop: config.marginTop,
    marginRight: config.marginRight,
    marginBottom: config.marginBottom,
    marginLeft: config.marginLeft,
    showFiventsLogo: config.showFiventsLogo,
    fiventsLogoPosition: config.fiventsLogoPosition,
    fiventsLogoSize: config.fiventsLogoSize,
    showOrgLogo: config.showOrgLogo,
    orgLogoPosition: config.orgLogoPosition,
    orgLogoSize: config.orgLogoSize,
    showQrCode: config.showQrCode,
    qrCodePosition: config.qrCodePosition,
    qrCodeSize: config.qrCodeSize,
    qrCodeContent: config.qrCodeContent,
    showName: config.showName,
    namePosition: config.namePosition,
    nameFontSize: config.nameFontSize,
    nameBold: config.nameBold,
    showCompany: config.showCompany,
    companyPosition: config.companyPosition,
    companyFontSize: config.companyFontSize,
    showJobTitle: config.showJobTitle,
    jobTitlePosition: config.jobTitlePosition,
    jobTitleFontSize: config.jobTitleFontSize,
    itemsOrder: config.itemsOrder,
    printerDpi: config.printerDpi,
    printerType: config.printerType,
    printSpeed: config.printSpeed,
    copies: config.copies,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    fontFamily: config.fontFamily,
    elementsLayout: config.elementsLayout,
  };
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Invalid image file.'));
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
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
  const [participantQrCodeValue, setParticipantQrCodeValue] = useState('');
  const [participantAccessCode, setParticipantAccessCode] = useState('');
  const [participantUseDocumentAsAccessCode, setParticipantUseDocumentAsAccessCode] = useState(false);
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

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [editQrCodeValue, setEditQrCodeValue] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('');
  const [editUseDocumentAsAccessCode, setEditUseDocumentAsAccessCode] = useState(false);
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);
  const [printLabelParticipant, setPrintLabelParticipant] = useState<EventParticipantDetailResponse | null>(null);
  const [isPrintingParticipantLabel, setIsPrintingParticipantLabel] = useState(false);

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
  const [settingsAddressDetails, setSettingsAddressDetails] = useState<EventAddress | null>(null);
  const [settingsStartsAt, setSettingsStartsAt] = useState('');
  const [settingsEndsAt, setSettingsEndsAt] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<EventResponse['status']>('DRAFT');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<EventAIConfigResponse>({
    confidenceThreshold: DEFAULT_AI_CONFIG.confidenceThreshold,
    detectionIntervalMs: DEFAULT_AI_CONFIG.detectionIntervalMs,
    maxFaces: DEFAULT_AI_CONFIG.maxFaces,
    livenessDetection: DEFAULT_AI_CONFIG.livenessDetection,
    minFaceSize: DEFAULT_AI_CONFIG.minFaceSize,
  });
  const [isSavingAIConfig, setIsSavingAIConfig] = useState(false);
  const [printConfigEnabled, setPrintConfigEnabled] = useState(false);
  const [printConfigDraft, setPrintConfigDraft] = useState<EditablePrintConfig>(() => createDefaultPrintConfig());
  const [printPromptEnabled, setPrintPromptEnabled] = useState(true);
  const [printPromptTimeoutSeconds, setPrintPromptTimeoutSeconds] = useState(15);
  const [isLoadingPrintConfig, setIsLoadingPrintConfig] = useState(false);
  const [isSavingPrintConfig, setIsSavingPrintConfig] = useState(false);

  // Link existing person state
  const [linkPersonOpen, setLinkPersonOpen] = useState(false);
  const [linkPersonSearch, setLinkPersonSearch] = useState('');
  const [linkPersonPage, setLinkPersonPage] = useState(1);
  const [linkPersonResults, setLinkPersonResults] = useState<PaginatedPeopleResponse | null>(null);
  const [isLoadingLinkPeople, setIsLoadingLinkPeople] = useState(false);
  const [isLinkingPerson, setIsLinkingPerson] = useState(false);

  // Public link state
  const [publicLinkUrl, setPublicLinkUrl] = useState<string | null>(null);
  const [isLoadingPublicLink, setIsLoadingPublicLink] = useState(false);
  const [isTogglingPublicLink, setIsTogglingPublicLink] = useState(false);

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

  const getCheckInMethodLabel = useCallback(
    (method: string) => {
      switch (method) {
        case 'FACE_RECOGNITION':
          return 'Reconhecimento Facial';
        case 'QR_CODE':
          return t('pages.eventDetail.qrCode');
        case 'ACCESS_CODE':
          return t('pages.eventDetail.accessCode');
        case 'MANUAL':
          return t('pages.eventDetail.manualCheckinTitle');
        default:
          return method;
      }
    },
    [t],
  );

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await eventsClient.getEventById(eventId);
      if (!response.success) {
        setEvent(null);
        setLoadError(response.error.message);
        return;
      }

      setEvent(response.data);
      setSettingsName(response.data.name);
      setSettingsDescription(response.data.description ?? '');
      setSettingsTimezone(response.data.timezone);
      setSettingsAddress(response.data.address ?? '');
      setSettingsAddressDetails(response.data.addressDetails ?? null);
      setSettingsStartsAt(new Date(response.data.startsAt).toISOString().slice(0, 16));
      setSettingsEndsAt(new Date(response.data.endsAt).toISOString().slice(0, 16));
      setSettingsStatus(response.data.status);
      setPrintConfigEnabled(Boolean(response.data.printConfigId));
      setPrintPromptEnabled(response.data.labelPrintPromptEnabled);
      setPrintPromptTimeoutSeconds(response.data.labelPrintPromptTimeoutSeconds);

      if (response.data.printConfigId) {
        setIsLoadingPrintConfig(true);
        try {
          const printConfigResponse = await eventsClient.getEventPrintConfig(eventId);

          if (printConfigResponse.success && printConfigResponse.data) {
            setPrintConfigDraft(toEditablePrintConfig(printConfigResponse.data));
          } else {
            toast.error(t('pages.eventDetail.printConfigError'));
          }
        } finally {
          setIsLoadingPrintConfig(false);
        }
      } else {
        setPrintConfigDraft(createDefaultPrintConfig());
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadEventError');
      setEvent(null);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, t]);

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
  }, [eventId, participantsPage, participantsSearch, t]);

  const loadPeopleForLinking = useCallback(async () => {
    if (!event?.organizationId) return;

    setIsLoadingLinkPeople(true);
    try {
      const response = await peopleClient.listPeople({
        organizationId: event.organizationId,
        page: linkPersonPage,
        pageSize: 10,
        search: linkPersonSearch,
        excludeEventId: eventId,
      });
      if (!response.success) throw new Error(response.error.message);
      setLinkPersonResults(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.loadPeopleError');
      toast.error(message);
    } finally {
      setIsLoadingLinkPeople(false);
    }
  }, [event?.organizationId, eventId, linkPersonPage, linkPersonSearch, t]);

  async function handleLinkPerson(person: PersonSummaryResponse) {
    setIsLinkingPerson(true);
    try {
      const response = await peopleClient.linkPersonToEvent(person.id, eventId);
      if (!response.success) {
        throw new Error((response.error as { message: string }).message);
      }
      toast.success(t('pages.eventDetail.linkPersonSuccess').replace('{name}', person.name));
      setLinkPersonOpen(false);
      setLinkPersonSearch('');
      setLinkPersonPage(1);
      setLinkPersonResults(null);
      loadParticipants();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.linkPersonError');
      toast.error(message);
    } finally {
      setIsLinkingPerson(false);
    }
  }

  function resetCreateParticipantForm() {
    setParticipantName('');
    setParticipantEmail('');
    setParticipantDocument('');
    setParticipantDocumentType('');
    setParticipantPhone('');
    setParticipantCompany('');
    setParticipantJobTitle('');
    setParticipantQrCodeValue('');
    setParticipantAccessCode('');
    setParticipantUseDocumentAsAccessCode(false);
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

  async function handleCreateFaceFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setParticipantFaceImageDataUrl(dataUrl);
      setParticipantFaceImageUrl('');
      stopCreateFaceCamera();
    } catch {
      toast.error(t('pages.eventDetail.capturePhotoError'));
    } finally {
      input.value = '';
    }
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
        qrCodeValue: participantQrCodeValue.trim() || null,
        accessCode: participantUseDocumentAsAccessCode
          ? (participantDocument.trim() || participantAccessCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase())
          : (participantAccessCode.trim().toUpperCase() || null),
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      const normalizedFaceImageUrl = participantFaceImageUrl.trim();
      const normalizedFaceImageDataUrl = participantFaceImageDataUrl.trim();
      if (normalizedFaceImageUrl || normalizedFaceImageDataUrl) {
        const result = await extractFaceEmbedding(
          {
            imageDataUrl: normalizedFaceImageDataUrl || undefined,
            imageUrl: normalizedFaceImageUrl || undefined,
          },
          {
            requireSingleFace: true,
            maxFaces: aiConfig.maxFaces,
            minFaceSize: aiConfig.minFaceSize,
            minDetectionConfidence: 0.6,
          },
        );

        const { embedding, faceDetectionData } = result;

        const faceResponse = await participantsClient.registerFace({
          personId: response.data.personId,
          imageUrl: normalizedFaceImageUrl || undefined,
          imageDataUrl: normalizedFaceImageDataUrl || undefined,
          embedding,
          embeddingModel: 'Transformers.js ArcFace (512d)',
          faceDetectionData,
        });

        if (!faceResponse.success) {
          const errorMsg = faceResponse.error?.details
            ? faceResponse.error.details.map((d) => d.message).join('; ')
            : faceResponse.error?.message;
          throw new Error(errorMsg || 'Failed to register face');
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
  }, [eventId, t]);

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
  }, [eventId, t]);

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

  const loadAIConfig = useCallback(async () => {
    const response = await eventsClient.getEventAIConfig(eventId);
    if (response.success) {
      setAiConfig(response.data);
    }
  }, [eventId]);

  const loadPublicLink = useCallback(async () => {
    setIsLoadingPublicLink(true);
    try {
      const response = await eventsClient.getPublicLink(eventId);
      if (response.success) {
        setPublicLinkUrl(response.data.publicUrl);
      }
    } catch {
      // Silently fail - public link is optional
    } finally {
      setIsLoadingPublicLink(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || !canView)) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, canView, router]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      void loadEvent();
      void loadTotems();
      void loadCheckIns();
      void loadAIConfig();
      void loadPublicLink();
    }
  }, [isAuthenticated, canView, loadEvent, loadTotems, loadCheckIns, loadAIConfig, loadPublicLink]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      void loadParticipants();
    }
  }, [isAuthenticated, canView, loadParticipants]);

  useEffect(() => {
    if (editParticipant) {
      setEditCompany(editParticipant.company ?? '');
      setEditJobTitle(editParticipant.jobTitle ?? '');
      setEditQrCodeValue(editParticipant.qrCodeValue ?? '');
      setEditAccessCode(editParticipant.accessCode ?? '');
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

  useEffect(() => {
    if (linkPersonOpen) {
      loadPeopleForLinking();
    }
  }, [linkPersonOpen, linkPersonPage, linkPersonSearch, loadPeopleForLinking]);

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

  async function handleFaceFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setFaceImageDataUrl(dataUrl);
      setFaceImageUrl('');
      stopFaceCamera();
    } catch {
      toast.error(t('pages.eventDetail.capturePhotoError'));
    } finally {
      input.value = '';
    }
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
        qrCodeValue: editQrCodeValue.trim() || null,
        accessCode: editUseDocumentAsAccessCode
          ? (editParticipant.document?.trim() || editAccessCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase())
          : (editAccessCode.trim().toUpperCase() || null),
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
      const result = await extractFaceEmbedding(
        {
          imageDataUrl: normalizedImageDataUrl || undefined,
          imageUrl: normalizedImageUrl || undefined,
        },
        {
          requireSingleFace: true,
          maxFaces: aiConfig.maxFaces,
          minFaceSize: aiConfig.minFaceSize,
          minDetectionConfidence: 0.6,
        },
      );

      const { embedding, faceDetectionData } = result;

      if (registerFaceParticipant.faceId) {
        await participantsClient.replaceFaceImage(registerFaceParticipant.faceId, {
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding,
          embeddingModel: 'Transformers.js ArcFace (512d)',
          faceDetectionData,
          isActive: true,
        });
      } else {
        await participantsClient.registerFace({
          personId: registerFaceParticipant.personId,
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding,
          embeddingModel: 'Transformers.js ArcFace (512d)',
          faceDetectionData,
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
      const finalAddress = (settingsAddressDetails?.formattedAddress ?? settingsAddress).trim();
      const normalizedAddressDetails: EventAddress | null = finalAddress
        ? {
            ...(settingsAddressDetails ?? {}),
            formattedAddress: finalAddress,
            source: settingsAddressDetails?.source ?? 'manual',
          }
        : null;

      await eventsClient.updateEvent(event.id, {
        name: settingsName.trim(),
        description: settingsDescription.trim() || null,
        timezone: settingsTimezone.trim(),
        address: finalAddress || null,
        addressDetails: normalizedAddressDetails,
        startsAt: startDate,
        endsAt: endDate,
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

  async function handleTogglePublicLink() {
    setIsTogglingPublicLink(true);
    try {
      if (publicLinkUrl) {
        const response = await eventsClient.removePublicLink(eventId);
        if (!response.success) throw new Error('Failed to remove link');
        setPublicLinkUrl(null);
        toast.success(t('pages.eventDetail.publicLinkRemoved'));
      } else {
        const response = await eventsClient.generatePublicLink(eventId);
        if (!response.success) throw new Error('Failed to generate link');
        setPublicLinkUrl(response.data.publicUrl);
        toast.success(t('pages.eventDetail.publicLinkGenerated'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.publicLinkError');
      toast.error(message);
    } finally {
      setIsTogglingPublicLink(false);
    }
  }

  async function handleCopyPublicLink() {
    if (!publicLinkUrl) return;
    try {
      await navigator.clipboard.writeText(publicLinkUrl);
      toast.success(t('pages.eventDetail.linkCopied'));
    } catch {
      toast.error(t('pages.eventDetail.copyError'));
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

  async function handleResetAIConfig() {
    setIsSavingAIConfig(true);
    try {
      const response = await eventsClient.updateEventAIConfig(eventId, {
        confidenceThreshold: DEFAULT_AI_CONFIG.confidenceThreshold,
        detectionIntervalMs: DEFAULT_AI_CONFIG.detectionIntervalMs,
        maxFaces: DEFAULT_AI_CONFIG.maxFaces,
        livenessDetection: DEFAULT_AI_CONFIG.livenessDetection,
        minFaceSize: DEFAULT_AI_CONFIG.minFaceSize,
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      setAiConfig(response.data);
      toast.success(t('pages.eventDetail.aiResetSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.aiUpdateError');
      toast.error(message);
    } finally {
      setIsSavingAIConfig(false);
    }
  }

  function updatePrintConfigField<Key extends keyof EditablePrintConfig>(key: Key, value: EditablePrintConfig[Key]) {
    setPrintConfigDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function movePrintItem(item: PrintItemKey, direction: 'up' | 'down') {
    setPrintConfigDraft((current) => {
      const order = [...current.itemsOrder] as PrintItemKey[];
      const index = order.indexOf(item);

      if (index === -1) {
        return current;
      }

      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= order.length) {
        return current;
      }

      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];

      return {
        ...current,
        itemsOrder: order,
      };
    });
  }

  const previewParticipant = useMemo<PrintParticipantData>(() => {
    const previewEventName = event?.name ?? 'Evento';
    const previewEventId = event?.id ?? 'preview-event';
    const fallbackCompany = 'Empresa Exemplo';
    const fallbackJobTitle = 'Cargo Exemplo';

    const latestCheckIn = checkIns[0];
    const latestParticipant = latestCheckIn
      ? participants.find((participant) => participant.id === latestCheckIn.eventParticipantId)
      : null;

    if (latestCheckIn) {
      return {
        name: latestCheckIn.participantName,
        company: latestParticipant?.company || fallbackCompany,
        jobTitle: latestParticipant?.jobTitle || fallbackJobTitle,
        participantId: latestCheckIn.eventParticipantId,
        checkInId: latestCheckIn.id,
        eventName: previewEventName,
        eventId: previewEventId,
      };
    }

    return {
      name: 'Participante Exemplo',
      company: fallbackCompany,
      jobTitle: fallbackJobTitle,
      participantId: 'preview-participant',
      checkInId: 'preview-checkin',
      eventName: previewEventName,
      eventId: previewEventId,
    };
  }, [checkIns, participants, event?.id, event?.name]);

  const previewPrintConfig = useMemo<PrintConfigFullResponse>(() => {
    return {
      id: event?.printConfigId ?? 'preview',
      ...printConfigDraft,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }, [event?.printConfigId, printConfigDraft]);

  function handlePrintLayoutChange(layout: Record<PrintItemKey, { x: number; y: number }>) {
    updatePrintConfigField('elementsLayout', layout);
  }

  function handleResetPrintLayout() {
    const defaultLayout = buildDefaultElementsLayout(previewPrintConfig, previewParticipant);
    updatePrintConfigField('elementsLayout', defaultLayout);
  }

  async function handleSavePrintConfig(e: React.FormEvent) {
    e.preventDefault();

    if (!event) {
      return;
    }

    setIsSavingPrintConfig(true);

    try {
      if (!printConfigEnabled) {
        if (event.printConfigId) {
          const response = await eventsClient.updateEvent(event.id, {
            printConfigId: null,
          });

          if (!response.success) {
            throw new Error(response.error.message);
          }

          setEvent(response.data);
        }

        toast.success(t('pages.eventDetail.saveSettings'));
        return;
      }

      const response = await eventsClient.updateEventPrintConfig(event.id, printConfigDraft);
      if (!response.success) {
        throw new Error(response.error.message);
      }

      setPrintConfigDraft(toEditablePrintConfig(response.data));

      if (event.printConfigId !== response.data.id) {
        setEvent((current) => {
          if (!current) return current;
          return {
            ...current,
            printConfigId: response.data.id,
          };
        });
      }

      toast.success(t('pages.eventDetail.printConfigCreated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.printConfigError');
      toast.error(message);
    } finally {
      setIsSavingPrintConfig(false);
    }
  }

  // Calculate valid status transitions
  const validStatusTransitions = useMemo(() => {
    return getValidTransitions(event?.status ?? 'DRAFT');
  }, [event?.status]);

  const isStatusFinal = useMemo(() => {
    return isFinalStatus(event?.status ?? 'DRAFT');
  }, [event?.status]);

  if (isLoadingPage || !isAuthenticated || !canView) {
    return null;
  }

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!event) {
    return (
      <DetailUnavailable
        message={loadError ?? t('pages.eventDetail.loadEventError')}
        onBack={() => router.replace(`/organizations/${organizationId}/events`)}
      />
    );
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
                value={event.addressDetails?.formattedAddress ?? event.address ?? '—'}
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setLinkPersonOpen(true)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {t('pages.eventDetail.linkPerson')}
                  </Button>
                  <Button size="sm" onClick={() => setCreateParticipantOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('pages.eventDetail.addParticipant')}
                  </Button>
                </div>
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
                        <TableHead>{t('pages.eventDetail.accessCode')}</TableHead>
                        <TableHead>{t('pages.eventDetail.qrCode')}</TableHead>
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
                          <TableCell className="text-muted-foreground">{participant.accessCode ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{participant.qrCodeValue ?? '—'}</TableCell>
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={!participant.hasCheckIn || !printConfigEnabled}
                              onClick={() => setPrintLabelParticipant(participant)}
                              title={!printConfigEnabled ? 'Impressão não configurada' : !participant.hasCheckIn ? 'Participante sem check-in' : 'Imprimir etiqueta'}
                            >
                              <Printer className="h-4 w-4" />
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
                          <TableCell className="text-muted-foreground">
                            {getCheckInMethodLabel(checkIn.method)}
                          </TableCell>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('pages.eventDetail.publicLinkTitle')}
              </CardTitle>
              <CardDescription>{t('pages.eventDetail.publicLinkDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPublicLink ? (
                <Skeleton className="h-10 w-full" />
              ) : publicLinkUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input value={publicLinkUrl} readOnly className="flex-1 font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPublicLink}
                      title={t('pages.eventDetail.copyLink')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(publicLinkUrl, '_blank')}
                      title={t('pages.eventDetail.openLink')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleTogglePublicLink}
                    disabled={isTogglingPublicLink}
                  >
                    {isTogglingPublicLink ? t('pages.eventDetail.removing') : t('pages.eventDetail.removePublicLink')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">{t('pages.eventDetail.noPublicLink')}</p>
                  <Button onClick={handleTogglePublicLink} disabled={isTogglingPublicLink}>
                    <Globe className="mr-2 h-4 w-4" />
                    {isTogglingPublicLink
                      ? t('pages.eventDetail.generating')
                      : t('pages.eventDetail.generatePublicLink')}
                  </Button>
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
                    <Label htmlFor="settings-status">
                      {t('pages.eventDetail.statusSelect')}
                      {isStatusFinal && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({t('pages.eventDetail.statusFinal')})
                        </span>
                      )}
                    </Label>
                    <Select
                      value={settingsStatus}
                      onValueChange={(value) => setSettingsStatus(value as EventResponse['status'])}
                      disabled={isStatusFinal}
                    >
                      <SelectTrigger id="settings-status">
                        <SelectValue placeholder={t('pages.eventDetail.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        {validStatusTransitions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
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

                <div className="space-y-2">
                  <Label htmlFor="settings-timezone">{t('pages.eventDetail.timezone')} *</Label>
                  <Input
                    id="settings-timezone"
                    value={settingsTimezone}
                    onChange={(e) => setSettingsTimezone(e.target.value)}
                    required
                  />
                </div>

                <EventAddressEditor
                  idPrefix="settings-event-address"
                  label={t('pages.eventDetail.address')}
                  placeholder={t('pages.organizationEvents.addressPlaceholder')}
                  address={settingsAddress}
                  addressDetails={settingsAddressDetails}
                  onAddressChange={setSettingsAddress}
                  onAddressDetailsChange={setSettingsAddressDetails}
                />

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

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveSettings')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Facial Recognition Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="h-5 w-5" />
                {t('pages.eventDetail.facialRecognitionTitle')}
              </CardTitle>
              <CardDescription>{t('pages.eventDetail.facialRecognitionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAIConfig} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-threshold">{t('pages.eventDetail.confidenceThreshold')}</Label>
                    <Input
                      id="ai-threshold"
                      type="number"
                      min={AI_CONFIG_CONSTRAINTS.confidenceThreshold.min}
                      max={AI_CONFIG_CONSTRAINTS.confidenceThreshold.max}
                      step={AI_CONFIG_CONSTRAINTS.confidenceThreshold.step}
                      value={aiConfig.confidenceThreshold}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          confidenceThreshold: Number(e.target.value),
                        }))
                      }
                    />
                    <p className="text-muted-foreground text-xs">{t('pages.eventDetail.confidenceThresholdHint')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-interval">{t('pages.eventDetail.detectionInterval')}</Label>
                    <Input
                      id="ai-interval"
                      type="number"
                      min={AI_CONFIG_CONSTRAINTS.detectionIntervalMs.min}
                      max={AI_CONFIG_CONSTRAINTS.detectionIntervalMs.max}
                      step={AI_CONFIG_CONSTRAINTS.detectionIntervalMs.step}
                      value={aiConfig.detectionIntervalMs}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          detectionIntervalMs: Number(e.target.value),
                        }))
                      }
                    />
                    <p className="text-muted-foreground text-xs">{t('pages.eventDetail.detectionIntervalHint')}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-max-faces">{t('pages.eventDetail.maxFaces')}</Label>
                    <Input
                      id="ai-max-faces"
                      type="number"
                      min={AI_CONFIG_CONSTRAINTS.maxFaces.min}
                      max={AI_CONFIG_CONSTRAINTS.maxFaces.max}
                      step={AI_CONFIG_CONSTRAINTS.maxFaces.step}
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
                      min={AI_CONFIG_CONSTRAINTS.minFaceSize.min}
                      max={AI_CONFIG_CONSTRAINTS.minFaceSize.max}
                      step={AI_CONFIG_CONSTRAINTS.minFaceSize.step}
                      value={aiConfig.minFaceSize}
                      onChange={(e) =>
                        setAiConfig((current) => ({
                          ...current,
                          minFaceSize: Number(e.target.value),
                        }))
                      }
                    />
                    <p className="text-muted-foreground text-xs">{t('pages.eventDetail.minFaceSizeHint')}</p>
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
                    className="h-4 w-4"
                  />
                  <Label htmlFor="ai-liveness" className="flex-1 cursor-pointer">
                    {t('pages.eventDetail.enableLiveness')}
                    <span className="text-muted-foreground ml-2 text-xs">({t('pages.eventDetail.experimental')})</span>
                  </Label>
                </div>

                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" onClick={handleResetAIConfig} disabled={isSavingAIConfig}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('pages.eventDetail.resetToDefaults')}
                  </Button>
                  <Button type="submit" disabled={isSavingAIConfig}>
                    {isSavingAIConfig ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveAiSettings')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                {t('pages.eventDetail.printConfig')}
              </CardTitle>
              <CardDescription>Configure o ticket impresso e visualize um preview fiel da impressão.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePrintConfig} className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Impressão automática</p>
                    <p className="text-muted-foreground text-xs">
                      Ao ativar, o ticket será impresso após qualquer check-in (facial, QR ou código).
                    </p>
                  </div>
                  <Switch checked={printConfigEnabled} onCheckedChange={setPrintConfigEnabled} />
                </div>

                {printConfigEnabled ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="print-paper-width">{t('labelConfig.paper.width')}</Label>
                        <Input
                          id="print-paper-width"
                          type="number"
                          min={20}
                          max={300}
                          value={printConfigDraft.paperWidth}
                          onChange={(e) => updatePrintConfigField('paperWidth', parseNumber(e.currentTarget.value, 62))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="print-paper-height">{t('labelConfig.paper.height')}</Label>
                        <Input
                          id="print-paper-height"
                          type="number"
                          min={20}
                          max={500}
                          value={printConfigDraft.paperHeight}
                          onChange={(e) =>
                            updatePrintConfigField('paperHeight', parseNumber(e.currentTarget.value, 100))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="print-orientation">{t('labelConfig.paper.orientation')}</Label>
                        <Select
                          value={printConfigDraft.orientation}
                          onValueChange={(value) =>
                            updatePrintConfigField('orientation', value as 'PORTRAIT' | 'LANDSCAPE')
                          }
                        >
                          <SelectTrigger id="print-orientation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PORTRAIT">{t('labelConfig.paper.portrait')}</SelectItem>
                            <SelectItem value="LANDSCAPE">{t('labelConfig.paper.landscape')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="print-margin-top">Top (mm)</Label>
                        <Input
                          id="print-margin-top"
                          type="number"
                          min={0}
                          max={50}
                          value={printConfigDraft.marginTop}
                          onChange={(e) => updatePrintConfigField('marginTop', parseNumber(e.currentTarget.value, 5))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="print-margin-right">Right (mm)</Label>
                        <Input
                          id="print-margin-right"
                          type="number"
                          min={0}
                          max={50}
                          value={printConfigDraft.marginRight}
                          onChange={(e) => updatePrintConfigField('marginRight', parseNumber(e.currentTarget.value, 5))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="print-margin-bottom">Bottom (mm)</Label>
                        <Input
                          id="print-margin-bottom"
                          type="number"
                          min={0}
                          max={50}
                          value={printConfigDraft.marginBottom}
                          onChange={(e) =>
                            updatePrintConfigField('marginBottom', parseNumber(e.currentTarget.value, 5))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="print-margin-left">Left (mm)</Label>
                        <Input
                          id="print-margin-left"
                          type="number"
                          min={0}
                          max={50}
                          value={printConfigDraft.marginLeft}
                          onChange={(e) => updatePrintConfigField('marginLeft', parseNumber(e.currentTarget.value, 5))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-name">{t('labelConfig.items.name')}</Label>
                          <Switch
                            id="print-show-name"
                            checked={printConfigDraft.showName}
                            onCheckedChange={(checked) => updatePrintConfigField('showName', checked)}
                          />
                        </div>
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="print-name-size">Size</Label>
                            <Input
                              id="print-name-size"
                              type="number"
                              min={8}
                              max={32}
                              value={printConfigDraft.nameFontSize}
                              onChange={(e) =>
                                updatePrintConfigField('nameFontSize', parseNumber(e.currentTarget.value, 16))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-name-bold">{t('labelConfig.position.bold')}</Label>
                          <Switch
                            id="print-name-bold"
                            checked={printConfigDraft.nameBold}
                            onCheckedChange={(checked) => updatePrintConfigField('nameBold', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-company">{t('labelConfig.items.company')}</Label>
                          <Switch
                            id="print-show-company"
                            checked={printConfigDraft.showCompany}
                            onCheckedChange={(checked) => updatePrintConfigField('showCompany', checked)}
                          />
                        </div>
                        <Input
                          type="number"
                          min={6}
                          max={24}
                          value={printConfigDraft.companyFontSize}
                          onChange={(e) =>
                            updatePrintConfigField('companyFontSize', parseNumber(e.currentTarget.value, 12))
                          }
                        />

                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-job">{t('labelConfig.items.jobTitle')}</Label>
                          <Switch
                            id="print-show-job"
                            checked={printConfigDraft.showJobTitle}
                            onCheckedChange={(checked) => updatePrintConfigField('showJobTitle', checked)}
                          />
                        </div>
                        <Input
                          type="number"
                          min={6}
                          max={24}
                          value={printConfigDraft.jobTitleFontSize}
                          onChange={(e) =>
                            updatePrintConfigField('jobTitleFontSize', parseNumber(e.currentTarget.value, 10))
                          }
                        />
                      </div>

                      <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-fivents">{t('labelConfig.items.fiventsLogo')}</Label>
                          <Switch
                            id="print-show-fivents"
                            checked={printConfigDraft.showFiventsLogo}
                            onCheckedChange={(checked) => updatePrintConfigField('showFiventsLogo', checked)}
                          />
                        </div>
                        <Input
                          type="number"
                          min={5}
                          max={100}
                          value={printConfigDraft.fiventsLogoSize}
                          onChange={(e) =>
                            updatePrintConfigField('fiventsLogoSize', parseNumber(e.currentTarget.value, 20))
                          }
                        />

                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-org">{t('labelConfig.items.orgLogo')}</Label>
                          <Switch
                            id="print-show-org"
                            checked={printConfigDraft.showOrgLogo}
                            onCheckedChange={(checked) => updatePrintConfigField('showOrgLogo', checked)}
                          />
                        </div>
                        <Input
                          type="number"
                          min={5}
                          max={100}
                          value={printConfigDraft.orgLogoSize}
                          onChange={(e) =>
                            updatePrintConfigField('orgLogoSize', parseNumber(e.currentTarget.value, 25))
                          }
                        />

                        <div className="flex items-center justify-between">
                          <Label htmlFor="print-show-qr">{t('labelConfig.items.qrCode')}</Label>
                          <Switch
                            id="print-show-qr"
                            checked={printConfigDraft.showQrCode}
                            onCheckedChange={(checked) => updatePrintConfigField('showQrCode', checked)}
                          />
                        </div>
                        <Input
                          type="number"
                          min={10}
                          max={120}
                          value={printConfigDraft.qrCodeSize}
                          onChange={(e) => updatePrintConfigField('qrCodeSize', parseNumber(e.currentTarget.value, 28))}
                        />
                        <Select
                          value={printConfigDraft.qrCodeContent}
                          onValueChange={(value) =>
                            updatePrintConfigField(
                              'qrCodeContent',
                              value as 'participant_id' | 'check_in_url' | 'custom',
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="participant_id">ID do participante</SelectItem>
                            <SelectItem value="check_in_url">URL do check-in</SelectItem>
                            <SelectItem value="custom">Customizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>{t('labelConfig.printer.type')}</Label>
                        <Select
                          value={printConfigDraft.printerType}
                          onValueChange={(value) =>
                            updatePrintConfigField('printerType', value as 'thermal' | 'inkjet' | 'laser')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thermal">{t('labelConfig.printer.thermal')}</SelectItem>
                            <SelectItem value="inkjet">{t('labelConfig.printer.inkjet')}</SelectItem>
                            <SelectItem value="laser">{t('labelConfig.printer.laser')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>DPI</Label>
                        <Input
                          type="number"
                          min={72}
                          max={1200}
                          value={printConfigDraft.printerDpi}
                          onChange={(e) =>
                            updatePrintConfigField('printerDpi', parseNumber(e.currentTarget.value, 203))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labelConfig.printer.speed')}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={printConfigDraft.printSpeed}
                          onChange={(e) => updatePrintConfigField('printSpeed', parseNumber(e.currentTarget.value, 3))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labelConfig.printer.copies')}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={printConfigDraft.copies}
                          onChange={(e) => updatePrintConfigField('copies', parseNumber(e.currentTarget.value, 1))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>{t('labelConfig.paper.font')}</Label>
                        <Input
                          value={printConfigDraft.fontFamily}
                          onChange={(e) => updatePrintConfigField('fontFamily', e.currentTarget.value || 'Arial')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labelConfig.paper.bgColor')}</Label>
                        <Input
                          type="color"
                          value={printConfigDraft.backgroundColor}
                          onChange={(e) => updatePrintConfigField('backgroundColor', e.currentTarget.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('labelConfig.paper.textColor')}</Label>
                        <Input
                          type="color"
                          value={printConfigDraft.textColor}
                          onChange={(e) => updatePrintConfigField('textColor', e.currentTarget.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-sm font-medium">Ordem dos elementos</p>
                      {(printConfigDraft.itemsOrder as PrintItemKey[]).map((item, index) => (
                        <div key={item} className="flex items-center justify-between rounded border px-3 py-2">
                          <span className="text-sm">
                            {item === 'fiventsLogo'
                              ? t('labelConfig.items.fiventsLogo')
                              : item === 'orgLogo'
                                ? t('labelConfig.items.orgLogo')
                                : item === 'name'
                                  ? t('labelConfig.items.name')
                                  : item === 'company'
                                    ? t('labelConfig.items.company')
                                    : item === 'jobTitle'
                                      ? t('labelConfig.items.jobTitle')
                                      : t('labelConfig.items.qrCode')}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={index === 0}
                              onClick={() => movePrintItem(item, 'up')}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={index === printConfigDraft.itemsOrder.length - 1}
                              onClick={() => movePrintItem(item, 'down')}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Layout livre e coordenadas reais de impressao</p>
                        <Button type="button" variant="outline" size="sm" onClick={handleResetPrintLayout}>
                          Resetar layout
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        O editor usa unidade em milimetros (mm) e reflete o layout final do ticket impresso.
                      </p>
                      <PrintLayoutEditor
                        config={previewPrintConfig}
                        participant={previewParticipant}
                        onLayoutChange={handlePrintLayoutChange}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Impressão desativada. Nenhum ticket será impresso após check-in.
                  </p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingPrintConfig || isLoadingPrintConfig}>
                    {isSavingPrintConfig ? t('pages.eventDetail.saving') : t('pages.eventDetail.saveSettings')}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant-qr-code">QR Code</Label>
                <Input
                  id="participant-qr-code"
                  value={participantQrCodeValue}
                  onChange={(e) => setParticipantQrCodeValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant-access-code">Código de acesso</Label>
                <Input
                  id="participant-access-code"
                  disabled={participantUseDocumentAsAccessCode && Boolean(participantDocument.trim())}
                  value={participantUseDocumentAsAccessCode && participantDocument.trim() ? participantDocument.trim() : participantAccessCode}
                  onChange={(e) => setParticipantAccessCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="participant-use-document"
                checked={participantUseDocumentAsAccessCode}
                onCheckedChange={setParticipantUseDocumentAsAccessCode}
              />
              <Label htmlFor="participant-use-document" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Usar documento como código de acesso
              </Label>
            </div>
            
            {participantUseDocumentAsAccessCode && !participantDocument.trim() && (
              <p className="text-xs text-amber-500 font-medium pb-2">
                Documento não informado, será usado um código de acesso padrão.
              </p>
            )}

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
              <Label htmlFor="participant-face-upload">Upload de imagem (opcional)</Label>
              <Input
                id="participant-face-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleCreateFaceFileChange(event);
                }}
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
            <div className="space-y-2">
              <Label htmlFor="edit-qr-code">QR Code</Label>
              <Input id="edit-qr-code" value={editQrCodeValue} onChange={(e) => setEditQrCodeValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-access-code">Código de acesso</Label>
              <Input
                id="edit-access-code"
                disabled={editUseDocumentAsAccessCode && Boolean(editParticipant.document?.trim())}
                value={editUseDocumentAsAccessCode && editParticipant.document?.trim() ? editParticipant.document.trim() : editAccessCode}
                onChange={(e) => setEditAccessCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-use-document"
                checked={editUseDocumentAsAccessCode}
                onCheckedChange={setEditUseDocumentAsAccessCode}
              />
              <Label htmlFor="edit-use-document" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Usar documento como código de acesso
              </Label>
            </div>
            
            {editUseDocumentAsAccessCode && !editParticipant.document?.trim() && (
              <p className="text-xs text-amber-500 font-medium">
                Documento não informado, usando código padrão editável na UI.
              </p>
            )}
            
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
            <InfoRow label="QR Code" value={viewParticipant?.qrCodeValue ?? '—'} />
            <InfoRow label="Código de acesso" value={viewParticipant?.accessCode ?? '—'} />
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
              <Label htmlFor="face-upload">Upload de imagem (opcional)</Label>
              <Input
                id="face-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleFaceFileChange(event);
                }}
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

      {/* Link Existing Person Dialog */}
      <Dialog
        open={linkPersonOpen}
        onOpenChange={(open) => {
          setLinkPersonOpen(open);
          if (!open) {
            setLinkPersonSearch('');
            setLinkPersonPage(1);
            setLinkPersonResults(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('pages.eventDetail.linkPersonTitle')}</DialogTitle>
            <DialogDescription>{t('pages.eventDetail.linkPersonDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder={t('pages.eventDetail.linkPersonSearchPlaceholder')}
              value={linkPersonSearch}
              onChange={(e) => {
                setLinkPersonSearch(e.target.value);
                setLinkPersonPage(1);
              }}
            />

            {isLoadingLinkPeople ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : linkPersonResults && linkPersonResults.items.length > 0 ? (
              <div className="space-y-2">
                {linkPersonResults.items.map((person) => (
                  <div key={person.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="text-muted-foreground truncate text-sm">{person.email}</p>
                    </div>
                    <Button size="sm" onClick={() => handleLinkPerson(person)} disabled={isLinkingPerson}>
                      {isLinkingPerson ? t('pages.eventDetail.linking') : t('pages.eventDetail.linkAction')}
                    </Button>
                  </div>
                ))}

                {/* Pagination */}
                {linkPersonResults.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={linkPersonPage <= 1}
                      onClick={() => setLinkPersonPage((p) => Math.max(1, p - 1))}
                    >
                      {t('pages.eventDetail.previous')}
                    </Button>
                    <span className="text-muted-foreground text-sm">
                      {linkPersonPage} / {linkPersonResults.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={linkPersonPage >= linkPersonResults.totalPages}
                      onClick={() => setLinkPersonPage((p) => p + 1)}
                    >
                      {t('pages.eventDetail.next')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">{t('pages.eventDetail.linkPersonEmpty')}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkPersonOpen(false)}>
              {t('pages.eventDetail.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <LabelPrintConfirmationModal
        open={!!printLabelParticipant}
        participantName={printLabelParticipant?.name}
        timeoutSeconds={printPromptTimeoutSeconds || 15}
        isPrinting={isPrintingParticipantLabel}
        onCancel={() => setPrintLabelParticipant(null)}
        onConfirm={async () => {
          if (!printLabelParticipant || !event) return;
          setIsPrintingParticipantLabel(true);
          try {
            const printConfigResponse = await eventsClient.getEventPrintConfig(event.id);
            if (!printConfigResponse.success || !printConfigResponse.data) {
              throw new Error('Configuração de impressão não encontrada');
            }
            const printData = {
              name: printLabelParticipant.name,
              company: printLabelParticipant.company,
              jobTitle: printLabelParticipant.jobTitle,
              participantId: printLabelParticipant.id,
              checkInId: '', // CheckIn ID can be omitted or retrieved differently if needed
              eventName: event.name,
              eventId: event.id,
            };
            const result = await printBadgeSilently(printConfigResponse.data, printData);
            logPrintAttempt(event.id, printLabelParticipant.id, result);
            if (result.success) {
               toast.success('Impressão concluída com sucesso');
               setPrintLabelParticipant(null);
            } else {
               toast.error(result.error || 'Ocorreu um erro durante a impressão.');
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao imprimir etiqueta');
          } finally {
            setIsPrintingParticipantLabel(false);
          }
        }}
      />
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

function DetailUnavailable({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nao foi possivel carregar os detalhes do evento</CardTitle>
        <CardDescription>Verifique suas permissoes e tente novamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-rose-600">{message}</p>
        <div className="flex gap-2">
          <Button onClick={onBack}>Voltar para eventos</Button>
        </div>
      </CardContent>
    </Card>
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
